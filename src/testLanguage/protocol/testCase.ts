import { PathUtils } from "../../utils/path";


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

let uniqueId = 0;

export class TestCase {

    public code: string;

    public id:string;

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
     * The children tests
     */
    //public children: Array<TestCase>;

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

    public parendId : string = null;

    public isTestCase: boolean = true;

    public isRunning: boolean = false;

    public hasChildren : boolean = false;

    /**
     * TestResult.ErrorMessage provides an error message if the test failed.
     */
    errorMessage: string;

    /**
     * TestResult.ErrorStackTrace provides the stack trace for the error.
     */
    errorStackTrace: string;

    /**
     * TestResult.Outcome provides an integer specifying the result of a test case execution.
     */
    status: TestCaseStatus;

    /**
     * TestResult.StartTime provides the start time of the test case execution.
     */
    startTime: Date;

    /**
     * TestResult.EndTime provides the end time of test case execution.
     */
    endTime: Date;

    /**
     * The plain test result object
     */
    //plainObject: VSTestProtocol.TestResult;

    sessionId: number;

    /**
     * Return the test duration in milliseconds
     */
    duration: number;


    constructor() {
        this.status = TestCaseStatus.None;
        this.id = (uniqueId++).toString();
    }

    public getCode(): string {
        return this.code;
    }

    public getId() : string {
        return this.id;
    }

    setPath(path: string): void {
        this.path = PathUtils.normalizePath(path);
    }

    setOutputPath(outputPath: string): void {
        this.outputPath = PathUtils.normalizePath(outputPath);
    }

    setTitle(title: string): void {
        this.title = title;
    }

    setLine(line: number): void {
        this.line = line;
    }

    setColumn(column: number): void {
        this.column = column;
    }

}

