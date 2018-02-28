import { RequestType } from 'vscode-jsonrpc';
import { TestCase } from '../../protocol'

/** 
 * The change type that happend with the file  
 */
export enum FileChangeType {
	Change,
	Create,
	Delete
}

/** 
 * The file that has changed
 */
export interface FileChangeParams {
	type: FileChangeType;
	path: string;
}

/** 
 * The params that are used to dispatch a discovery test case request
 * Send the directory when you want to request every test that is inside that directory
 * Send fileChanges when there is a change on a file based on the provided [#InitializeResult.watchFilesGlob]
 */
export interface DiscoveryTestCasesParams {
	directory?: string;
	fileChanges?: Array<FileChangeParams>;
}

/**
 * The result returned from an discovery tests request.
 */
export interface DiscoveryTestCasesResult {
	testCases: Array<TestCase>;
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


