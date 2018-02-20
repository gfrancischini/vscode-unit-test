import { RequestHandler, createMessageConnection, StreamMessageReader, StreamMessageWriter, NotificationType } from 'vscode-jsonrpc';
import {
    InitializeRequest, InitializeParams, InitializeResult, InitializeError,
    RunTestCasesParams, RunTestCasesResult,
    TestCaseUpdateNotification, TestCaseUpdateParams
} from "../testLanguage/protocol"
import { TestCase, TestCaseStatus } from "../testLanguage/protocol";
import * as path from "path";
import { escapeRegex } from "../utils/string"
import { IConnection, TestLanguageServer } from "../testLanguage/server/testLanguageServer"
import { getOptions } from "./mochaOptionsReader"

function calculateGrep(testCase: TestCase) {
    if (testCase.parendId == null) {
        //when there is no parentId we are sending the entire file to test
        return null;
    }
    return escapeRegex(testCase.fullTitle);
}

function managedRequire(id: string) {
    if (path.isAbsolute(id) === false) {
        //when the path is not absolute we should try to load it from node_modules folder
        id = path.join(process.cwd(), "node_modules", id);
    }
    try {
        delete require.cache[id];
        require(id);
    }
    catch (err) {
        console.log(`managedRequire(${id}) - ${err}`);
    }
}

export function RunMochaProcess(sessionId: number, optsPath: string, testCases: Array<TestCase>, connection): Promise<any> {
    let qtyOfTests: number = 0;
    let currentFilePath: string = null;

    class MochaProcess {
        private filePath: string;
        private grep: string;
        private opts;

        constructor(opts: Array<{}>) {
            this.opts = opts;
        }

        private applyMochaOpts(mocha: Mocha) {
            if (this.opts == null) {
                return;
            }

            console.log("Options: " + JSON.stringify(this.opts));

            this.opts.forEach(option => {
                switch (option.key) {
                    case "--require":
                        managedRequire(option.value);
                        break;
                    case "--ui":
                        mocha.ui(option.value);
                        break;
                    case "--timeout":
                        mocha.timeout(option.value);
                        break;
                }
            });

        }

        public createMocha(filePath: string, grep: string): Mocha {
            this.filePath = filePath;
            currentFilePath = filePath;
            this.grep = grep;

            const Mocha: any = require("mocha");
            const mocha: Mocha = new Mocha({ ui: "bdd", timeout: 999999 });
            mocha.ui("bdd");

            this.applyMochaOpts(mocha);

            // require nodejs ts source map support
            //require("source-map-support/register");


            //console.log(`\nTest File: ${filePath}`);
            // delete files from cache for re-evalutation
            delete require.cache[filePath];
            mocha.addFile(filePath);

            // only apply grep pattern if not null
            if (grep) {
                grep = `^(${grep})$`;
                //console.log(`\nGrep Pattern: ${grep}`);
                mocha.grep(new RegExp(grep, "i"));
            }
            (<any>mocha).reporter(customReporter);
            //mocha.reporter(ReportsCustom);
            return mocha;
        }


        public runMocha(mocha: Mocha): Promise<any> {
            return new Promise((resolve, reject) => {
                const callback: any = (failures: number) => {
                    resolve();
                };
                try {
                    mocha.run(callback);
                } catch (err) {

                    testCases.forEach((testCase) => {
                        if (testCase.path === currentFilePath && testCase.sessionId != sessionId) {
                            testCase.isRunning = false;
                            testCase.status = TestCaseStatus.Failed;
                            testCase.sessionId = sessionId;
                            testCase.errorMessage = err.message;
                            testCase.errorStackTrace = err.stack;
                            testCase.startTime = new Date();
                            testCase.endTime = new Date();
                            testCase.duration = 0;
                            connection.testCaseUpdate({
                                testCase
                            });
                        }
                    })

                    resolve();

                    console.log("err: ");
                }
            });
        }
    }


    const opts = optsPath ? getOptions(optsPath) : null;

    let mochaProcess: MochaProcess = new MochaProcess(opts);

    return new Promise<any>(async (resolve, reject) => {
        for (let testCase of testCases) {
            let mocha: Mocha = mochaProcess.createMocha(testCase.path, calculateGrep(testCase));
            let promise = mochaProcess.runMocha(mocha);
            await promise;
        }
        resolve();
    });


    function findTestCaseByName(title, path) {
        const filtered = testCases.filter((testCase) => {
            return testCase.title === title && testCase.path === path;
        });
        return filtered != null && filtered[0];
    }

    /**
     * Create a custom mocha test reporter
     * @param runner The runner
     * @param options Mocha Option
     */
    function customReporter(runner: any, options: any): any {
        const suitePath: Array<string> = []

        let total: number = runner.total;
        qtyOfTests = total;

        let qtyOfFailures = 0;
        let qtyOfSkip = 0;
        let qtyOfSuccess = 0;

        runner
            .on("start", start => {
                console.log(`Start running test source ${currentFilePath}`);

                const testCase: TestCase = findTestCaseByName(path.basename(currentFilePath), currentFilePath);
                if (testCase) {
                    testCase.isRunning = true;
                    testCase.sessionId = sessionId;
                    testCase.startTime = new Date();

                    connection.testCaseUpdate({
                        testCase
                    });
                }

            })
            .on("suite", suite => {
                // mocha adds a main suite for every test file. We are going to skip this
                if (!suite.title) {
                    return;
                }

                console.log(`${"\t".repeat(suitePath.length + 1)}Start running test suite ${suite.title}`);

                const testCase: TestCase = findTestCaseByName(suite.title, (<any>suite).file);
                if (testCase) {
                    testCase.isRunning = true;
                    testCase.sessionId = sessionId;
                    testCase.startTime = new Date();

                    connection.testCaseUpdate({
                        testCase
                    });
                }

                suitePath.push(suite.fullTitle());
            })
            .on("suite end", (suite) => {
                // mocha adds a main suite for every test file. We are going to skip this
                if (!suite.title) {
                    return;
                }
                suitePath.pop();

                const testCase: TestCase = findTestCaseByName(suite.title, (<any>suite).file);
                if (testCase) {
                    testCase.isRunning = false;
                    testCase.endTime = new Date();
                    testCase.duration = new Date(testCase.endTime).getTime() - new Date(testCase.startTime).getTime();

                    if (qtyOfFailures > 0) {

                        testCase.status = TestCaseStatus.Failed;
                    }
                    else if (qtyOfSkip > 0) {
                        testCase.status = TestCaseStatus.Skipped;
                    }
                    else if (qtyOfSuccess > 0) {
                        testCase.status = TestCaseStatus.Passed;
                    }
                    else {

                    }

                    connection.testCaseUpdate({
                        testCase
                    });
                }

            })
            .on("pass", (test) => {
                qtyOfSuccess++;
                const testCase: TestCase = findTestCaseByName(test.title, (<any>test).file);
                testCase.isRunning = false;
                testCase.status = TestCaseStatus.Passed;
                testCase.endTime = new Date();
                testCase.duration = new Date(testCase.endTime).getTime() - new Date(testCase.startTime).getTime();

                connection.testCaseUpdate({
                    testCase
                });

            })
            .on("fail", (test, err) => {
                qtyOfFailures++;
                if (test.type === "hook") {
                    if (test.parent != null) {
                        //mochaProcessServer.sendNotifyOnTestHookError(new MochaProcessTestCaseUpdate(
                        //    suitePath.slice(0, suitePath.length - 1), test.parent.title,
                        //    currentFilePath, "fail", test.duration, err.message, err.stack));
                    }
                    // mochaProcessCallback(new MochaProcessArgumentsCallback("test update",
                    //    new MochaProcessTestCaseResult(suitePath.slice(0, suitePath.length - 1), 
                    // test.parent.title, (<any>test.parent).file, "suite fail", err.message, err.stack)));
                    console.log("HOOK ERR= " + err);
                }
                else {
                    const testCase: TestCase = findTestCaseByName(test.title, (<any>test).file);
                    testCase.isRunning = false;
                    testCase.errorMessage = err.message;
                    testCase.errorStackTrace = err.stack;
                    testCase.status = TestCaseStatus.Failed;
                    testCase.endTime = new Date();
                    testCase.duration = new Date(testCase.endTime).getTime() - new Date(testCase.startTime).getTime();

                    connection.testCaseUpdate({
                        testCase
                    });

                }
            })
            .on("pending", (test) => {
                qtyOfSkip++;
                //mochaProcessServer.sendNotifyOnTestCaseEnd(new MochaProcessTestCaseUpdate(suitePath, test.title,
                //   (<any>test).file, "pending", test.duration));
            })
            .on("end", () => {
                const testCase: TestCase = findTestCaseByName(path.basename(currentFilePath), currentFilePath);
                if (testCase) {
                    testCase.isRunning = false;
                    testCase.endTime = new Date();
                    testCase.duration = new Date(testCase.endTime).getTime() - new Date(testCase.startTime).getTime();

                    if (qtyOfFailures > 0) {

                        testCase.status = TestCaseStatus.Failed;
                    }
                    else if (qtyOfSkip > 0) {
                        testCase.status = TestCaseStatus.Skipped;
                    }
                    else if (qtyOfSuccess > 0) {
                        testCase.status = TestCaseStatus.Passed;
                    }
                    else {

                    }

                    connection.testCaseUpdate({
                        testCase
                    });
                }

            })
            .on("test", (test: Mocha.ITest) => {
                console.log(`${"\t".repeat(suitePath.length + 2)}Start running test ${test.title}`);
                const testCase: TestCase = findTestCaseByName(test.title, (<any>test).file);

                testCase.isRunning = true;
                testCase.sessionId = sessionId;
                testCase.startTime = new Date();

                connection.testCaseUpdate({
                    testCase
                });

            });
    }
}


