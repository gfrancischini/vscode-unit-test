import * as chai from "chai"

import { MochaTestLanguageServer } from "./mochaTestLanguageServer"
import { TestCase, TestCaseStatus } from "../testLanguage/protocol";
import { TestSuite, TestSuiteUpdateParams, TestSuiteUpdateType } from "./testRunner/protocol"
import { TestCaseCompare, equalsTestCase, resetTestCase, getTestCaseByFullTitle } from "../test/compare"
import { PathUtils } from "../utils/path"

class TestableMochaTestLanguageServer extends MochaTestLanguageServer {
    public testCases: Array<TestCase>;
    public currentTestSession = {
        sesssionId: 0,
        qtyOfFailures: 0,
        qtyOfSkip: 0,
        qtyOfSuccess: 0,
    }

    constructor() {
        super();
        this.currentTestSession.sesssionId = 1000;
    }

    public convertTestSuiteToTestCase(type: TestSuiteUpdateType, testSuite: TestSuite): TestCase {
        return super.convertTestSuiteToTestCase(type, testSuite);
    }

    public findTestCaseByFullTitleAndPath(testCases: Array<TestCase>, fullTitle: string, filePath: string) {
        return super.findTestCaseByFullTitleAndPath(testCases, fullTitle, filePath);
    }

}

suite("convertTestSuiteToTestCase", () => {
    
    let mochaTestLanguageServer: TestableMochaTestLanguageServer;

    setup(() => {
        mochaTestLanguageServer = new TestableMochaTestLanguageServer();

        const fakeFileTestCase = new TestCase();
        fakeFileTestCase.path = PathUtils.normalizePath("c:/fakeFileTestCase.js");
        fakeFileTestCase.title = "";
        fakeFileTestCase.fullTitle = "";

        mochaTestLanguageServer.testCases.push(fakeFileTestCase);

        const fakeTestCaseSuite = new TestCase();
        fakeTestCaseSuite.path = PathUtils.normalizePath("c:/fakeFileTestCase.js");
        fakeTestCaseSuite.title = "fakeTestCaseSuite";
        fakeTestCaseSuite.fullTitle = "fakeTestCaseSuite";
        fakeTestCaseSuite.parentId = fakeFileTestCase.id;

        mochaTestLanguageServer.testCases.push(fakeTestCaseSuite);

        const fakeTestCaseTest = new TestCase();
        fakeTestCaseTest.path = PathUtils.normalizePath("c:/fakeFileTestCase.js");
        fakeTestCaseTest.title = "fakeTestCaseTest";
        fakeTestCaseTest.fullTitle = "fakeTestCaseSuite fakeTestCaseTest";
        fakeTestCaseTest.parentId = fakeFileTestCase.id;

        mochaTestLanguageServer.testCases.push(fakeTestCaseTest);

        
    });

    test("file test start", () => {
        const actual = mochaTestLanguageServer.convertTestSuiteToTestCase(TestSuiteUpdateType.Start, {
            path: "c:/fakeFileTestCase.js",
            fullTitle: ""
        });
        equalsTestCase(actual, {
            //startTime: new Date(),
            isRunning: true,
            sessionId: 1000
        });
    })

    test("suite test start", () => {
        const actual = mochaTestLanguageServer.convertTestSuiteToTestCase(TestSuiteUpdateType.SuiteStart, {
            path: "c:/fakeFileTestCase.js",
            fullTitle: "fakeTestCaseSuite"
        });
        equalsTestCase(actual, {
            //startTime: new Date(),
            isRunning: true,
            sessionId: 1000
        });
    })

    test("test start", () => {
        const actual = mochaTestLanguageServer.convertTestSuiteToTestCase(TestSuiteUpdateType.TestStart, {
            path: "c:/fakeFileTestCase.js",
            fullTitle: "fakeTestCaseSuite fakeTestCaseTest"
        });
        equalsTestCase(actual, {
            //startTime: new Date(),
            isRunning: true,
            sessionId: 1000
        });
    })

    test("test fail", () => {
        getTestCaseByFullTitle("fakeTestCaseSuite fakeTestCaseTest", mochaTestLanguageServer.testCases).startTime = new Date();

        const actual = mochaTestLanguageServer.convertTestSuiteToTestCase(TestSuiteUpdateType.TestFail, {
            path: "c:/fakeFileTestCase.js",
            fullTitle: "fakeTestCaseSuite fakeTestCaseTest",
            err: {
                message: "error message",
                stack: "error stack"
            }
        });
        equalsTestCase(actual, {
            //startTime: new Date(),
            //endTime: new Date(),
            isRunning: false,
            errorMessage: "error message",
            errorStackTrace: "error stack",
            status: TestCaseStatus.Failed,
        });
    })

    test("test hook fail", () => {
        const actual = mochaTestLanguageServer.convertTestSuiteToTestCase(TestSuiteUpdateType.HookFail, {
            path: "c:/fakeFileTestCase.js",
            fullTitle: "fakeTestCaseSuite",
            err: {
                message: "error message",
                stack: "error stack"
            }
        });
        equalsTestCase(actual, {
            //startTime: new Date(),
            //endTime: new Date(),
            isRunning: false,
            sessionId: 1000,
            errorMessage: "error message",
            errorStackTrace: "error stack",
            status: TestCaseStatus.Failed,
        });

        const filtered = mochaTestLanguageServer.testCases.filter((testCase) => {
            return testCase.parentId === actual.parentId;
        })

        equalsTestCase(filtered[0], {
            //startTime: new Date(),
            //endTime: new Date(),
            isRunning: false,
            sessionId: 1000,
            errorMessage: "error message",
            errorStackTrace: "error stack",
            status: TestCaseStatus.Failed,
        });
    })

    test("test SuiteEnd Passed", () => {
        mochaTestLanguageServer.currentTestSession.qtyOfSuccess = 1;
        const actual = mochaTestLanguageServer.convertTestSuiteToTestCase(TestSuiteUpdateType.SuiteEnd, {
            path: "c:/fakeFileTestCase.js",
            fullTitle: "fakeTestCaseSuite",
        });
        equalsTestCase(actual, {
            //startTime: new Date(),
            //endTime: new Date(),
            isRunning: false,
            status: TestCaseStatus.Passed,
        });
    });

    test("test SuiteEnd Passed without running any test", () => {
        const actual = mochaTestLanguageServer.convertTestSuiteToTestCase(TestSuiteUpdateType.SuiteEnd, {
            path: "c:/fakeFileTestCase.js",
            fullTitle: "fakeTestCaseSuite",
        });
        equalsTestCase(actual, {
            //startTime: new Date(),
            //endTime: new Date(),
            isRunning: false,
            status: TestCaseStatus.Passed,
        });
    });

    test("test SuiteEnd Failure", () => {
        mochaTestLanguageServer.currentTestSession.qtyOfFailures = 1;
        mochaTestLanguageServer.currentTestSession.qtyOfSkip = 1;
        mochaTestLanguageServer.currentTestSession.qtyOfSuccess = 1;
        const actual = mochaTestLanguageServer.convertTestSuiteToTestCase(TestSuiteUpdateType.SuiteEnd, {
            path: "c:/fakeFileTestCase.js",
            fullTitle: "fakeTestCaseSuite",
        });
        equalsTestCase(actual, {
            //startTime: new Date(),
            //endTime: new Date(),
            isRunning: false,
            status: TestCaseStatus.Failed,
        });
    })

    test("test SuiteEnd Skipped", () => {
        mochaTestLanguageServer.currentTestSession.qtyOfSkip = 1;
        mochaTestLanguageServer.currentTestSession.qtyOfSuccess = 1;
        const actual = mochaTestLanguageServer.convertTestSuiteToTestCase(TestSuiteUpdateType.SuiteEnd, {
            path: "c:/fakeFileTestCase.js",
            fullTitle: "fakeTestCaseSuite",
        });
        equalsTestCase(actual, {
            //startTime: new Date(),
            //endTime: new Date(),
            isRunning: false,
            status: TestCaseStatus.Skipped,
        });
    })
});