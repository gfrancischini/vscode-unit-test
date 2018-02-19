import {RequestType, NotificationType} from 'vscode-jsonrpc';
import {TestCase} from "../../testTreeModel/testCase"
export interface FileProcessor {
    /** 
     * The file path to process 
     */
    path : string;
    
    /** 
     * The grep to be aplied to this file
     */
    grep : string;
}


export interface InitializeParams {
	/**
	 * The process Id of the parent process that started
	 * the server. Is null if the process has not been started by another process.
	 * If the parent process is not alive then the server should exit (see exit notification) its process.
	 */
    processId: number | null;
    

    testCases : TestCase[];

	/**
	 * The rootPath of the workspace. Is null
	 * if no folder is open.
	 *
	 * @deprecated in favour of rootUri.
	 */
    rootPath?: string | null;
    
	sessionId : number;

	/**
	 * The initial trace setting. If omitted trace is disabled ('off').
	 */
	trace?: 'off' | 'messages' | 'verbose';
}

/**
 * The result returned from an initilize request.
 */
export interface InitializeResult {
	/**
	 * Custom initialization results.
	 */
	[custom: string]: any;
}

/**
 * The data type of the ResponseError if the
 * initialize request fails.
 */
export interface InitializeError {
	/**
	 * Indicates whether the client execute the following retry logic:
	 * (1) show the message provided by the ResponseError to the user
	 * (2) user selects retry or cancel
	 * (3) if user selected retry the initialize method is sent again.
	 */
	retry: boolean;
}

export interface InitializedParams {
}

/**
 * Known error codes for an `InitializeError`;
 */
export namespace InitializeError {
	/**
	 * If the protocol version provided by the client can't be handled by the server.
	 * @deprecated This initialize error got replaced by client capabilities. There is
	 * no version handshake in version 3.0x
	 */
	export const unknownProtocolVersion: number = 1;
}

/**
 * The initialize request is sent from the client to the server.
 * It is sent once as the request after starting up the server.
 * The requests parameter is of type [InitializeParams](#InitializeParams)
 * the response if of type [InitializeResult](#InitializeResult) of a Thenable that
 * resolves to such.
 */
export namespace InitializeRequest {
	export const type = new RequestType<InitializeParams, InitializeResult, InitializeError, void>('initialize');
}




export interface TestCaseUpdateParams {
	testCase : TestCase;
}



export namespace TestUpdateNotification {
	export const type = new NotificationType<TestCaseUpdateParams, void>('testCaseUpdate');
}