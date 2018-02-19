import {RequestType} from 'vscode-jsonrpc';

export interface DiscoveryTestCasesParams {
	filePaths : Array<string>;
}

/**
 * The result returned from an discovery tests request.
 */
export interface DiscoveryTestCasesResult {

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


