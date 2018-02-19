import { RequestHandler, createMessageConnection, StreamMessageReader, StreamMessageWriter, NotificationType } from 'vscode-jsonrpc';
import { InitializeRequest, InitializeParams, InitializeResult, InitializeError, FileProcessor, TestUpdateNotification, TestCaseUpdateParams } from "./mochaProtocol"
import { TestCase } from "../../testTreeModel/testCase";
import { TestOutcome } from "../../testTreeModel/testCaseResult";
import * as path from "path";

import { escapeRegex } from "../../utils/string"
interface IConnection {
    listen(): void;
    onInitialize(handler: any): void;
    testCaseUpdate(params: TestCaseUpdateParams): void;
}



function createConnection(input: any, output: any) {
    let connection = createMessageConnection(input, output);

    //let initializeHandler: RequestHandler<InitializeParams, InitializeResult, InitializeError> | undefined = undefined;

    let result: IConnection = {

        listen: (): void => connection.listen(),
        onInitialize: (handler) => connection.onRequest(InitializeRequest.type, handler),
        testCaseUpdate: (params: TestCaseUpdateParams) => connection.sendNotification(TestUpdateNotification.type, params)
    }

    return result;
}

const connection = createConnection(new StreamMessageReader(process.stdin),
    new StreamMessageWriter(process.stdout));



connection.onInitialize((params: InitializeParams): any => {
    //console.log(params);

    RunMochaProcess(params.sessionId, params.testCases);

    return { customResults: { "hello": "world" } };
});

connection.listen();

/**
 * Override default console.log to redirect output from user test cases to the appropriate channel
 */
console.log = function (str: string) {

};


function RunMochaProcess(sessionId: number, testCases: Array<TestCase>): any {
    let qtyOfTests: number = 0;
    let currentFilePath: string = null;
    //let testCase : Array<TestCase> = null;

    class MochaProcess {
        private filePath: string;
        private grep: string;

        public createMocha(filePath: string, grep: string): Mocha {
            this.filePath = filePath;
            currentFilePath = filePath;
            this.grep = grep;

            const Mocha: any = require("mocha");
            const mocha: Mocha = new Mocha({ ui: "bdd", timeout: 999999 });
            mocha.ui("bdd");

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
            return mocha;
        }


        public runMocha(mocha: Mocha): Promise<any> {
            return new Promise((resolve, reject) => {
                const callback: any = (failures: number) => {
                    //mochaProcessServer.sendNotifyOnTestFrameworkEnd(new MochaTestFrameworkDetail(qtyOfTests, failures));
                    resolve();
                };
                try {
                    mocha.run(callback);
                } catch (err) {

                    testCases.forEach((testCase) => {
                        if (testCase.result.sessionId != sessionId) {
                            testCase.result.status = TestOutcome.Failed;
                            testCase.result.sessionId = sessionId;
                            testCase.result.errorMessage = err.message;
                            testCase.result.errorStackTrace = err.stack;
                            connection.testCaseUpdate({
                                testCase
                            });
                        }
                    })

                    //mochaProcessServer.sendNotifyOnTestFrameworkException(new MochaProcessTestCaseUpdate("", "",
                    //    this.filePath, "", 0, err.message, err.stack));
                    resolve();

                    console.log("err: ");
                }
            });
        }
    }

    let mochaProcess: MochaProcess = new MochaProcess();

    return new Promise<any>(async (resolve, reject) => {
        /*for (let file of files) {
            let mocha: Mocha = mochaProcess.createMocha(file.path, file.grep);
            let promise = mochaProcess.runMocha(mocha);
            await promise;
        };*/

        for (let testCase of testCases) {
            let mocha: Mocha = mochaProcess.createMocha(testCase.path, calculateGrep(testCase));
            let promise = mochaProcess.runMocha(mocha);
            await promise;
        }

        resolve();
    });

    function calculateGrep(testCase: TestCase) {
        if (testCase.parendId == null) {
            //when there is no parentId we are sending the entire file to test
            return null;
        }

        //if (testCase.children != null) {
        /*testCase.getChildren().forEach((childreTestCase : TestCase) => {
            childreTestCase.getFullTitle();
        })*/

        //      const grep = testCase.children.map(childrenTestCase => this.calculateGrep(childrenTestCase)).join("|");
        //      return grep;
        //testCase.getChildren()

        //return  testCase.getFullTitle() + "|"
        //}
        return escapeRegex(testCase.fullTitle);

        //grep += '^(' + this.selectors.map(o => escapeRegExp(o)).join('|') + ')$';
    }

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

                //mochaProcessServer.sendNotifyOnTestFrameworkStart(new MochaTestFrameworkDetail(total));
                //mochaProcessServer.sendNotifyOnTestFileStart(new MochaProcessTestCaseUpdate(
                //    suitePath, "", currentFilePath, "file start", 0));

                const testCase: TestCase = findTestCaseByName(path.basename(currentFilePath), currentFilePath);
                if (testCase) {
                    testCase.result.status = TestOutcome.Running;
                    testCase.result.sessionId = sessionId;
                    testCase.result.startTime = new Date();

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

                const testCase: TestCase = findTestCaseByName(suite.title, (<any>suite).file);
                if (testCase) {
                    testCase.result.status = TestOutcome.Running;
                    testCase.result.sessionId = sessionId;
                    testCase.result.startTime = new Date();

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
                    testCase.result.endTime = new Date();

                    if (qtyOfFailures > 0) {

                        testCase.result.status = TestOutcome.Failed;
                    }
                    else if (qtyOfSkip > 0) {
                        testCase.result.status = TestOutcome.Skipped;
                    }
                    else if (qtyOfSuccess > 0) {
                        testCase.result.status = TestOutcome.Passed;
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

                testCase.result.status = TestOutcome.Passed;
                testCase.result.endTime = new Date();

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
                    testCase.result.errorMessage = err.message;
                    testCase.result.errorStackTrace = err.stack;
                    testCase.result.status = TestOutcome.Failed;
                    testCase.result.endTime = new Date();

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
                    testCase.result.endTime = new Date();

                    if (qtyOfFailures > 0) {

                        testCase.result.status = TestOutcome.Failed;
                    }
                    else if (qtyOfSkip > 0) {
                        testCase.result.status = TestOutcome.Skipped;
                    }
                    else if (qtyOfSuccess > 0) {
                        testCase.result.status = TestOutcome.Passed;
                    }
                    else {

                    }

                    connection.testCaseUpdate({
                        testCase
                    });
                }

            })
            .on("test", (test: Mocha.ITest) => {

                const testCase: TestCase = findTestCaseByName(test.title, (<any>test).file);

                testCase.result.status = TestOutcome.Running;
                testCase.result.sessionId = sessionId;
                testCase.result.startTime = new Date();

                connection.testCaseUpdate({
                    testCase
                });

            });
    }
}












/*let notification = new NotificationType<string, void>('testNotification');
connection.onNotification(notification, (param: string) => {
    console.log("server:" + param); // This prints Hello World
});



let notification2 = new NotificationType<string, void>('testNotification2');
connection.sendNotification(notification2, "connected");*/