import { MochaRunnerServer } from "./server"
import { TestSuite, TestSuiteUpdateType, TestSuiteUpdateParams } from "./protocol"

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

function toTestSuite(item): TestSuite {
    try {
        return {
            path: item.file,
            fullTitle: getFullTitle(item),
            title: item.title,
            duration: item.duration,
            err: item.err
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
async function MochaCustomReporter(runner: any, options: { reporterOptions: MochaCustomReporterOptions }) {
    const mochaRunnerServer: MochaRunnerServer = new MochaRunnerServer(options.reporterOptions.port);

    var x = await mochaRunnerServer.connectServer();

    const currentFilePath = "";
    let currentFileIndex = -1;
    runner
        .on("start", start => {
            currentFileIndex++;
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
            // mocha adds a main suite for every test file. We are going to skip this
            if (!suite.title) {
                return;
            }

            mochaRunnerServer.getConnection().testSuiteUpdate({
                type: TestSuiteUpdateType.SuiteStart,
                testSuite: toTestSuite(suite)
            });
        })
        .on("suite end", (suite) => {
            // mocha adds a main suite for every test file. We are going to skip this
            if (!suite.title) {
                return;
            }

            mochaRunnerServer.getConnection().testSuiteUpdate({
                type: TestSuiteUpdateType.SuiteEnd,
                testSuite: toTestSuite(suite)
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
                    testSuite: toTestSuite(test.parent)
                });
            }
            else {
                mochaRunnerServer.getConnection().testSuiteUpdate({
                    type: TestSuiteUpdateType.TestFail,
                    testSuite: toTestSuite(test)
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
        })
        .on("test", (test) => {
            mochaRunnerServer.getConnection().testSuiteUpdate({
                type: TestSuiteUpdateType.TestStart,
                testSuite: toTestSuite(test)
            });
        });
}

module.exports = MochaCustomReporter;