/**
 * The enumerator that describe the test outcome results
 */
export enum TestOutcome {
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

/**
 * Class that handle the test results
 */
export class TestCaseResult {
    /**
     * TestResult.DisplayName provides a friendly name for the test result.
     */
    displayName: string;

    /**
     * TestResult.Duration provides the entire duration of this test case execution.
     */
    duration: string;

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
    outcome: TestOutcome;

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
    public getDurationInMilliseconds(): number {
        return this.endTime.getTime() - this.startTime.getTime();
    }
}