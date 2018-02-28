import { PathUtils } from "../../utils/path";
import * as uuid from "uuid/v1"

/**
 * The enumerator that describe the test outcome results
 */
export enum TestCaseStatus {
    //None. Test case doesn't have an outcome.
    None = 0x0,
    //Passed
    Passed = 0x1,
    //Failed
    Failed = 0x2,
    //Skipped
    Skipped = 0x3,
    //Not found. Test case was not found during execution.
    NotFound = 0x4,
}

export class TestCase {
    /**
     * The external code
     */
    public code: string;

    /**
     * The internal id
     */
    public id: string;

    /**
     * The file path that this test belong.
     */
    public path: string;

    /**
     * The title (name) of the test.
     */
    public title: string;

    /**
     * Line where this test is found
     */
    public line: number = 0;

    /**
     * Column where this test is found
     */
    public column: number = 0;

    /**
     * Full title of this test
     */
    public fullTitle: string;

    /**
     * The parent id of this test
     */
    public parentId: string = null;

    /**
     * If this is a test or only a grouper
     */
    public isTestCase: boolean = true;

    /**
     * If the test is running
     */
    public isRunning: boolean = false;

    /**
     * If test has children. This helps the ui
     */
    public hasChildren: boolean = false;

    /**
     * Provides an error message if the test failed.
     */
    public errorMessage: string;

    /**
     * Provides the stack trace for the error.
     */
    public errorStackTrace: string;

    /**
     * Provides an integer specifying the result of a test case execution.
     */
    public status: TestCaseStatus;

    /**
     * Provides the start time of the test case execution.
     */
    public startTime: Date;

    /**
     * Provides the end time of test case execution.
     */
    public endTime: Date;

    /**
     * The session id when this test runs
     */
    public sessionId: number;

    /**
     * Return the test duration in milliseconds
     */
    public duration: number;

    constructor() {
        this.status = TestCaseStatus.None;
        this.id = uuid();
    }
}

