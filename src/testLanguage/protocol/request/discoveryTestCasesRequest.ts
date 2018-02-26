import {RequestType} from 'vscode-jsonrpc';
import {TestCase} from '../../protocol'
export interface DiscoveryTestCasesParams {
	directory : string;
}

/**
 * The result returned from an discovery tests request.
 */
export interface DiscoveryTestCasesResult {
	testCases : Array<TestCase>;
}

/**
 * The data type of the ResponseError if the
 * discovery tests request fails.
 */
export interface DiscoveryTestCasesError {
}


export namespace DiscoveryTestCasesRequest {
	export const type = new RequestType<DiscoveryTestCasesParams, DiscoveryTestCasesResult, DiscoveryTestCasesError, void>('discoveryTestCases');
}


