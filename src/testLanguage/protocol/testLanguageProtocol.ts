import {RequestType, NotificationType} from 'vscode-jsonrpc';
import {TestCase} from "./testCase"

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



