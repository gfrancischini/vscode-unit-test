import { RequestType } from 'vscode-jsonrpc';
import { TestCase } from "../testCase"

export interface RunTestCasesParams {
	testCases: Array<TestCase>;
	sessionId : number;
	debug : boolean;
}

/**
 * The result returned from an discovery tests request.
 */
export interface RunTestCasesResult {

}

/**
 * The data type of the ResponseError if the
 * discovery tests request fails.
 */
export interface RunTestCasesError {
}


export namespace RunTestCasesRequest {
	export const type = new RequestType<RunTestCasesParams, RunTestCasesResult, RunTestCasesError, void>('runTestCases');
}


