import * as chai from "chai"

import { MochaTestLanguageServer } from "./mochaTestLanguageServer"
import { TestCase, TestCaseStatus } from "../testLanguage/protocol";
import { TestSuite, TestSuiteUpdateParams, TestSuiteUpdateType } from "./testRunner/protocol"
import { TestCaseCompare, equalsTestCase } from "../test/compare"

class TestableMochaTestLanguageServer extends MochaTestLanguageServer {
    public testCases: Array<TestCase>;

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
    test("file test start", () => {
        const fakeTestCase = new TestCase();
        fakeTestCase.path = "fakeTestCase"
        fakeTestCase.title = "";
        fakeTestCase.fullTitle = "";

        const mochaTestLanguageServer: TestableMochaTestLanguageServer = new TestableMochaTestLanguageServer();
        mochaTestLanguageServer.testCases.push(fakeTestCase);
        const actual = mochaTestLanguageServer.convertTestSuiteToTestCase(TestSuiteUpdateType.Start, {
            path: "fakeTestCase",
            fullTitle: ""
        });
        equalsTestCase(actual, {
            //startTime: new Date(),
            isRunning: true,
            sessionId: 1000
        });
    })
});

/**
 * Start,
    SuiteStart,
    SuiteEnd,
    HookFail,
    TestFail,
    TestPass,
    TestPending,
    TestStart,
    End,
    Failure,
 */