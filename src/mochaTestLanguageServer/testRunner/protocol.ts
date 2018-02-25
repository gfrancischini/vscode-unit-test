import { RequestType, NotificationType } from 'vscode-jsonrpc';

export enum TestSuiteUpdateType {
    Start,
    SuiteStart,
    SuiteEnd,
    HookFail,
    TestFail,
    TestPass,
    TestPending,
    TestStart,
    End,
    Failure,
}

export interface TestSuite {
    path;
    title?;
    fullTitle?;
    duration?;
    err?;
}

/**
 * The result returned from an testsuite update notificaition.
 */
export interface TestSuiteUpdateParams {
    type: TestSuiteUpdateType;
    testSuite: TestSuite;
}


/** 
 * A test update noficiation is send from the server to the client when a test is updated
 * The notification params is of type TestSuiteUpdateParams[#TestSuiteUpdateParams]
 */
export namespace TestSuiteUpdateNotification {
    export const type = new NotificationType<TestSuiteUpdateParams, void>('testSuiteUpdate');
}

/** 
 * The params required for the RunRequest
 */
export interface RunParams {
    /**
	 * The mocha path.
	 */
    mochaPath: string,

    /**
	 * The files/grep dict
	 */
    filesDict: {},

    /**
	 * Custom mocha arguments
	 */
    mochaArguments: any,

	/**
	 * The initial trace setting. If omitted trace is disabled ('off').
	 */
    trace?: 'off' | 'messages' | 'verbose';
}

/**
 * The result returned from an run request.
 */
export interface RunResult {
}

/**
 * The data type of the ResponseError if the
 * run request fails.
 */
export interface RunError {
}

/**
 * The run request is sent from the client to the server.
 * The requests parameter is of type [RunParams](#RunParams)
 * the response if of type [RunResult](#RunResult) of a Thenable that
 * resolves to such.
 */
export namespace RunRequest {
    export const type = new RequestType<RunParams, RunResult, RunError, void>('run');
}
