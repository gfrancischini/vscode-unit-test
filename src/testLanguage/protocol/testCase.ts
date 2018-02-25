import { PathUtils } from "../../utils/path";

/** 
 * Unique internal id 
 */
let uniqueId = 0;

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
     * The path of the compiled filed.
     */
    public outputPath: string;

    /**
     * The title (name) of the test.
     */
    public title: string;

    /**
     * The parent test or file
     */
    public parent: TestCase;

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
    public parendId: string = null;

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
    errorMessage: string;

    /**
     * Provides the stack trace for the error.
     */
    errorStackTrace: string;

    /**
     * Provides an integer specifying the result of a test case execution.
     */
    status: TestCaseStatus;

    /**
     * Provides the start time of the test case execution.
     */
    startTime: Date;

    /**
     * Provides the end time of test case execution.
     */
    endTime: Date;

    /**
     * The session id when this test runs
     */
    sessionId: number;

    /**
     * Return the test duration in milliseconds
     */
    duration: number;

    constructor() {
        this.status = TestCaseStatus.None;
        this.id = (uniqueId++).toString();
    }
}

