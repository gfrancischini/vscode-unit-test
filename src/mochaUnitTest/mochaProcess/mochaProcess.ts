import {
    MochaProcessArguments, MochaProcessArgumentsCallback, MochaProcessTestCaseUpdate, MochaProcessError,
    MochaTestFrameworkDetail
} from "./mochaProcessArguments";
import * as path from "path";
import * as fs from "fs";



function RunMochaProcess(processArgs: MochaProcessArguments): any {
    let qtyOfTests: number = 0;
    let currentFilePath: string = null;

    interface MochaProcessOptions {
        require: Array<String>;
    }

    class MochaProcess {
        private filePath: string;
        private grep: string;

        public createMocha(filePath: string, grep: string, options: MochaProcessOptions): Mocha {
            this.filePath = filePath;
            currentFilePath = filePath;
            this.grep = grep;

            const Mocha: any = require("mocha");
            const mocha: Mocha = new Mocha({ ui: "bdd", timeout: 999999 });
            mocha.ui("bdd");

            // require nodejs ts source map support
            //require("source-map-support/register");

            if (options != null) {
                if (options.require != null) {
                    options.require.forEach((item: string) => {
                        require(item);
                    });
                }
            }

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
        for (let file of processArgs.files) {
            let mocha: Mocha = mochaProcess.createMocha(file.filePath, file.grep, { require: processArgs.require });
            let promise = mochaProcess.runMocha(mocha);
            await promise;
        }
        resolve();
    });

    /**
     * Create a custom mocha test reporter
     * @param runner The runner
     * @param options Mocha Option
     */
    function customReporter(runner: any, options: any): any {
        const suitePath: Array<string> = []

        let total: number = runner.total;
        qtyOfTests = total;
        runner
            .on("start", start => {

                //mochaProcessServer.sendNotifyOnTestFrameworkStart(new MochaTestFrameworkDetail(total));
                //mochaProcessServer.sendNotifyOnTestFileStart(new MochaProcessTestCaseUpdate(
                //    suitePath, "", currentFilePath, "file start", 0));
            })
            .on("suite", suite => {
                // mocha adds a main suite for every test file. We are going to skip this
                if (!suite.title) {
                    return;
                }

                // call the listener if not null
                //mochaProcessServer.sendNotifyOnTestSuiteStart(new MochaProcessTestCaseUpdate(
                //    suitePath, suite.title, /*(<any>suite).file*/ currentFilePath, "suite start", 0));
                suitePath.push(suite.fullTitle());
            })
            .on("suite end", (suite) => {
                // mocha adds a main suite for every test file. We are going to skip this
                if (!suite.title) {
                    return;
                }
                suitePath.pop();

                //mochaProcessServer.sendNotifyOnTestSuiteEnd(new MochaProcessTestCaseUpdate(
                //    suitePath, suite.title, currentFilePath/*suite.file*/, "suite end", suite.duration));
            })
            .on("pass", (test) => {
                //mochaProcessServer.sendNotifyOnTestCaseEnd(new MochaProcessTestCaseUpdate(
                //    suitePath, test.title, test.file, "pass", test.duration));
            })
            .on("fail", (test, err) => {
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
                    //mochaProcessServer.sendNotifyOnTestCaseEnd(new MochaProcessTestCaseUpdate(suitePath, test.title,
                    //    (<any>test).file, "fail", test.duration, err.message, err.stack));
                }
            })
            .on("pending", (test) => {
                //mochaProcessServer.sendNotifyOnTestCaseEnd(new MochaProcessTestCaseUpdate(suitePath, test.title,
                //   (<any>test).file, "pending", test.duration));
            })
            .on("end", () => {
                //mochaProcessServer.sendNotifyOnTestFileEnd(new MochaProcessTestCaseUpdate(
                //    suitePath, "", currentFilePath, "file end", 0));
                //mochaProcessCallback(new MochaProcessArgumentsCallback("unit test framework end", null));
            })
            .on("test", (test: Mocha.ITest) => {
                //mochaProcessServer.sendNotifyOnTestCaseStart(new MochaProcessTestCaseUpdate(suitePath,
                //    test.title, (<any>test).file, "test start", 0));
            });
    }
}

