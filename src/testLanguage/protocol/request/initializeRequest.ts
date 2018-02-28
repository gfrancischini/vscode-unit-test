import {RequestType} from 'vscode-jsonrpc';

export interface InitializeParams {
	/**
	 * The process Id of the parent process that started
	 * the server. Is null if the process has not been started by another process.
	 * If the parent process is not alive then the server should exit (see exit notification) its process.
	 */
    processId: number | null;
    
	/**
	 * The rootPath of the workspace. Is null
	 * if no folder is open.
	 *
	 */
	rootPath: string | null;

	/** 
	 * Object with the provider required settings read from vscode.settings
	 */
	settings : any;
	
	/**
	 * Custom initialization arguments request.
	 */
	[custom: string]: any;
	
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
	 * The current server version
	 */
	version : string;

	/** 
	 * The server initialization result 
	 */
	success : boolean;
	
	/** 
	 * A glob pattern for watch files changes to rebuild the test 
	 */
	watchFilesGlob? : string;

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


