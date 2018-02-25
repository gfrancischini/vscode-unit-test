import * as fs from "fs"
import { StreamMessageReader, SocketMessageWriter } from 'vscode-jsonrpc';
import {
    RunTestCasesParams, RunTestCasesResult,
    DiscoveryTestCasesParams, DiscoveryTestCasesResult
} from "../testLanguage/protocol"
import { TestCase, TestCaseStatus } from "../testLanguage/protocol";
import { escapeRegex } from "../utils/string"
import { TestLanguageServer } from "../testLanguage/server/testLanguageServer"
import { MochaTestFinder } from "./testFinder/mochaTestFinder"
import { MochaRunnerClient } from "./testRunner/client"
import { TestSuite, TestSuiteUpdateParams, TestSuiteUpdateType } from "./testRunner/protocol"

class MochaTestLanguageServer extends TestLanguageServer {
    //TODO implement a way to join test cases everytime we run the on discovery
    protected testCases: Array<TestCase> = new Array<TestCase>();

    /**
     * The moccha runner client responsible for running the tests
     */
    protected mochaRunnerClient: MochaRunnerClient;

    /**
     * The current test session results
     */
    protected currentTestSession = {
        sesssionId: 0,
        qtyOfFailures: 0,
        qtyOfSkip: 0,
        qtyOfSuccess: 0,

    }

    /**
     * Register the testLanguageServer listeners
     */
    public registerListeners() {
        super.registerListeners();

        this.connection.onRunTestCases((params: RunTestCasesParams) => {
            this.mochaRunnerClient = new MochaRunnerClient(12345);
            this.currentTestSession.sesssionId = params.sessionId;
            return new Promise((resolve, reject) => {
                this.mochaRunnerClient.connectClient(this.initializeParams.rootPath, 12345)
                    .then((client) => {
                        const dictFileGrep = groupTestByFile(params.testCases);

                        client.initialize({
                            filesDict: dictFileGrep,
                            mochaPath: "C:\\TFS\\SW\\mSeries\\7.0\\MobileApps\\node_modules\\mocha\\bin\\_mocha",
                            mochaArguments: { optsPath: this.initializeParams.optsPath }
                        }).then(() => {
                            console.log("response from initlize");

                            //kill the process
                            this.mochaRunnerClient.stopServer();

                            resolve({
                                "test": "ok"
                            })
                        })

                        client.onTestSuiteUpdated((params: TestSuiteUpdateParams) => {
                            const testCase = this.convertTestSuiteToTestCase(params.type, params.testSuite);
                            if (testCase) {
                                this.connection.testCaseUpdate({ testCase });
                            }
                        });
                    });
            });
        });

        this.connection.onDiscoveryTestCases((params: DiscoveryTestCasesParams): DiscoveryTestCasesResult => {
            const discoveryTestCases = new Array<TestCase>();
            params.filePaths.forEach((path) => {
                discoveryTestCases.push(...MochaTestFinder.findTestCases(path));
                this.testCases.push(...discoveryTestCases);
            })

            this.findDuplicatesTestCases(discoveryTestCases);

            return {
                testCases: discoveryTestCases
            }
        });

    }


    /**
     * Find all duplicate test cases and log the information
     * @param testCases
     */
    private findDuplicatesTestCases(testCases: Array<TestCase>) {
        const fullTitles = testCases.map((testCase) => { return testCase.fullTitle });

        const count = fullTitles =>
            fullTitles.reduce((a, b) =>
                Object.assign(a, { [b]: (a[b] || 0) + 1 }), {})

        const duplicates = dict =>
            Object.keys(dict).filter((a) => dict[a] > 1)

        const foundDuplicates = duplicates(count(fullTitles));

        foundDuplicates.forEach((fullTitle) => {
            const filtered = testCases.filter((testCase) => {
                return testCase.fullTitle === fullTitle;
            })
            filtered.forEach((testCase) => {
                console.log(`Duplicated test ${testCase.fullTitle} - Source ${testCase.path}:${testCase.line}`);
            });
        });
    }

    /**
     * Convert aa TestSuite to the TestCase protocol
     * @param type 
     * @param testSuite 
     */
    private convertTestSuiteToTestCase(type: TestSuiteUpdateType, testSuite: TestSuite): TestCase {
        const testCase: TestCase = this.findTestCaseByFullTitleAndPath(this.testCases, testSuite.fullTitle, testSuite.path);
        const sessionId = this.currentTestSession.sesssionId;
        if (testCase) {
            switch (type) {
                case TestSuiteUpdateType.Start:
                    this.currentTestSession.qtyOfFailures = 0;
                    this.currentTestSession.qtyOfSkip = 0;
                    this.currentTestSession.qtyOfSuccess = 0;
                case TestSuiteUpdateType.TestStart:
                case TestSuiteUpdateType.SuiteStart:
                    testCase.startTime = new Date();
                    testCase.isRunning = true;
                    testCase.sessionId = sessionId;
                    break;
                case TestSuiteUpdateType.TestFail:
                    this.currentTestSession.qtyOfFailures++;
                    testCase.isRunning = false;
                    testCase.errorMessage = testSuite.err.message;
                    testCase.errorStackTrace = testSuite.err.stack;
                    testCase.status = TestCaseStatus.Failed;
                    testCase.endTime = new Date();
                    testCase.duration = testCase.endTime.getTime() - testCase.startTime.getTime();
                    break;
                case TestSuiteUpdateType.TestPass:
                    this.currentTestSession.qtyOfSuccess++;
                    testCase.isRunning = false;
                    testCase.status = TestCaseStatus.Passed;
                    testCase.endTime = new Date();
                    testCase.duration = testCase.endTime.getTime() - testCase.startTime.getTime();
                    break;
                case TestSuiteUpdateType.TestPending:
                    this.currentTestSession.qtyOfSkip++;
                    testCase.isRunning = false;
                    testCase.status = TestCaseStatus.Skipped;
                    testCase.sessionId = sessionId;
                    testCase.duration = 0
                    break;
                case TestSuiteUpdateType.Failure:
                case TestSuiteUpdateType.HookFail:
                    this.currentTestSession.qtyOfFailures++;
                    testCase.isRunning = false;
                    testCase.errorMessage = testSuite.err.message;
                    testCase.errorStackTrace = testSuite.err.stack;
                    testCase.status = TestCaseStatus.Failed;
                    testCase.sessionId = sessionId;
                    testCase.endTime = new Date();
                    testCase.duration = new Date(testCase.endTime).getTime() - new Date(testCase.startTime).getTime();

                    this.markEveryChildWithParentError(this.testCases, testCase);
                    break;
                case TestSuiteUpdateType.SuiteEnd:
                case TestSuiteUpdateType.End:
                    testCase.isRunning = false;
                    testCase.endTime = new Date();
                    //testCase.duration = testCase.endTime.getTime() - testCase.startTime.getTime();

                    if (this.currentTestSession.qtyOfFailures > 0) {
                        testCase.status = TestCaseStatus.Failed;
                    }
                    else if (this.currentTestSession.qtyOfSkip > 0) {
                        testCase.status = TestCaseStatus.Skipped;
                    }
                    else if (this.currentTestSession.qtyOfSuccess > 0) {
                        testCase.status = TestCaseStatus.Passed;
                    }

                    break;
            }
        }

        return testCase;
    }

    /**
     * Find a test case by fullTitle and path
     * @param testCases 
     * @param fullTitle 
     * @param path 
     */
    private findTestCaseByFullTitleAndPath(testCases: Array<TestCase>, fullTitle: string, path: string) {
        const filtered = testCases.filter((testCase) => {
            return testCase.fullTitle === fullTitle && testCase.path === path;
        });
        return filtered != null && filtered[0];
    }

    /**
     * Search for every test case the is children (recursive) and copy the results
     * @param testCases 
     * @param parentTestCase 
     */
    private markEveryChildWithParentError(testCases: Array<TestCase>, parentTestCase: TestCase) {
        const filtered = testCases.filter((testCase) => {
            return testCase.parendId === parentTestCase.id;
        })

        filtered.forEach((testCase) => {
            testCase.errorMessage = parentTestCase.errorMessage;
            testCase.errorStackTrace = parentTestCase.errorStackTrace
            testCase.startTime = parentTestCase.startTime;
            testCase.endTime = parentTestCase.endTime;
            testCase.duration = parentTestCase.duration;
            testCase.status = parentTestCase.status;
            testCase.isRunning = parentTestCase.isRunning;
            testCase.sessionId = parentTestCase.sessionId;

            this.connection.testCaseUpdate({
                testCase
            });

            this.markEveryChildWithParentError(testCases, testCase);
        })
    }
}

/**
 * Calculate the grep of a test case
 * @return the grep
 */
function calculateGrep(testCase: TestCase) : string {
    if (testCase.parendId == null) {
        //when there is no parentId we are sending the entire file to test
        return null;
    }
    return escapeRegex(testCase.fullTitle);
}

/**
 * Group test cases by files and calculate de grep
 * @param testCases 
 */
function groupTestByFile(testCases: Array<TestCase>) {
    const dict = {};
    testCases.forEach((testCase) => {
        if (dict[testCase.path] == null) {
            dict[testCase.path] = calculateGrep(testCase);
        }
        else {
            dict[testCase.path] = dict[testCase.path] + "|" + calculateGrep(testCase);
        }
    })
    return dict;
}


//writeble strem from fd 3
const pipe = fs.createWriteStream(null, { fd: 3 });

const mochaLanguageServer = new MochaTestLanguageServer();
mochaLanguageServer.listen(new StreamMessageReader(process.stdin),
    new SocketMessageWriter(<any>pipe));

/**
 * Override default console.log to redirect output from user test cases to the appropriate channel
 */
console.log = function (data: string) {
    mochaLanguageServer.getConnection().dataOutput({ data });
};



