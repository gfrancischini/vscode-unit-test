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

export interface TestSuiteUpdateParams {
    type: TestSuiteUpdateType;
    testSuite: TestSuite;
}



export namespace TestSuiteUpdateNotification {
    export const type = new NotificationType<TestSuiteUpdateParams, void>('testSuiteUpdate');
}


export interface RunParams {
    mochaPath: string,

    filesDict: {},

    mochaArguments: any,

	/**
	 * The initial trace setting. If omitted trace is disabled ('off').
	 */
    trace?: 'off' | 'messages' | 'verbose';
}

/**
 * The result returned from an initilize request.
 */
export interface RunResult {
}

/**
 * The data type of the ResponseError if the
 * initialize request fails.
 */
export interface RunError {
}

/**
 * The initialize request is sent from the client to the server.
 * It is sent once as the request after starting up the server.
 * The requests parameter is of type [InitializeParams](#InitializeParams)
 * the response if of type [InitializeResult](#InitializeResult) of a Thenable that
 * resolves to such.
 */
export namespace RunRequest {
    export const type = new RequestType<RunParams, RunResult, RunError, void>('run');
}
