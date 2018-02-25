import { mochaRunnerServer } from "./serverInstance"
import { TestSuite, TestSuiteUpdateType, TestSuiteUpdateParams } from "./protocol"
//import * as mocha from "mocha";

interface MochaCustomReporterOptions {
    port: number
}

/**
 * Get the full title from a item
 * @param item 
 */
function getFullTitle(item: { title, parent }): string {
    if (item.parent != null && item.parent.title) {
        return getFullTitle(item.parent) + " " + item.title;
    }
    return item.title;
}

function toTestSuite(item, err = null): TestSuite {
    try {
        return {
            path: item.file,
            fullTitle: getFullTitle(item),
            title: item.title,
            duration: item.duration,
            err: err ? {
                message: err.message,
                stack: err.stack
            } : null
        }
    }
    catch (err) {
        console.log("impossible to convert to test suite: " + err + JSON.stringify(item))
    }
}



/**
   * Create a custom mocha test reporter
   * @param runner The runner
   * @param options Mocha Option
   */
export async function MochaCustomReporter(runner: any, options: { files: Array<string>, reporterOptions: MochaCustomReporterOptions }) {
    //(<any>mocha).reporters.Base.call(this, runner);



    let currentFilePath = options.files[0];
    runner
        .on("start", () => {
            mochaRunnerServer.getConnection().testSuiteUpdate({
                type: TestSuiteUpdateType.Start,
                testSuite: {
                    path: currentFilePath,
                    title: "",
                    fullTitle: ""
                }
            });
        })
        .on("suite", suite => {
            // mocha adds a main suite without title for every test file. We are going to skip this as a suite
            if (!suite.title) {
                return;
            }

            mochaRunnerServer.getConnection().testSuiteUpdate({
                type: TestSuiteUpdateType.SuiteStart,
                testSuite: toTestSuite(suite)
            });
        })
        .on("suite end", (suite) => {
            // mocha adds a main suite without title for every test file. We are going to skip this as a suite
            if (!suite.title) {
                return;
            }

            mochaRunnerServer.getConnection().testSuiteUpdate({
                type: TestSuiteUpdateType.SuiteEnd,
                testSuite: toTestSuite(suite)
            });
        })
        .on("test", (test) => {
            mochaRunnerServer.getConnection().testSuiteUpdate({
                type: TestSuiteUpdateType.TestStart,
                testSuite: toTestSuite(test)
            });
        })
        .on("pass", (test) => {
            mochaRunnerServer.getConnection().testSuiteUpdate({
                type: TestSuiteUpdateType.TestPass,
                testSuite: toTestSuite(test)
            });
        })
        .on("fail", (test, err) => {
            if (test.type === "hook" && test.parent != null) {
                mochaRunnerServer.getConnection().testSuiteUpdate({
                    type: TestSuiteUpdateType.HookFail,
                    testSuite: toTestSuite(test.parent, err)
                });
            }
            else {
                mochaRunnerServer.getConnection().testSuiteUpdate({
                    type: TestSuiteUpdateType.TestFail,
                    testSuite: toTestSuite(test, err)
                });
            }

        })
        .on("pending", (test) => {
            mochaRunnerServer.getConnection().testSuiteUpdate({
                type: TestSuiteUpdateType.TestPending,
                testSuite: toTestSuite(test)
            });
        })
        .on("end", () => {
            mochaRunnerServer.getConnection().testSuiteUpdate({
                type: TestSuiteUpdateType.End,
                testSuite: {
                    path: currentFilePath,
                    title: "",
                    fullTitle: ""
                }
            });
        });
}

//module.exports = MochaCustomReporter;