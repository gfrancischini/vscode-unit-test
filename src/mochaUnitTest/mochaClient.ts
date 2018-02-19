import * as cp from 'child_process';
import * as rpc from 'vscode-jsonrpc';
import * as path from "path";
import * as fs from "fs";
import { InitializeRequest, InitializeParams, InitializeResult, TestUpdateNotification, TestCaseUpdateParams } from "./mochaProcess/mochaProtocol"

interface IConnection {

    listen(): void;
    initialize(params: InitializeParams): Thenable<InitializeResult>;
    onTestCaseUpdated(handler: any): void;
}


export function connectClient(childProcess) {
    let connection = createConnection(
        new rpc.StreamMessageReader(childProcess.stdout),
        new rpc.StreamMessageWriter(childProcess.stdin));




    connection.listen();

    


    return connection;



}



export function createConnection(input: any, output: any) {
    // Use stdin and stdout for communication:
    let connection = rpc.createMessageConnection(
        input, output);

    let notification = new rpc.NotificationType<string, void>('testNotification');


    let result: IConnection = {

        listen: (): void => connection.listen(),
        initialize: (params: InitializeParams) => connection.sendRequest(InitializeRequest.type, params),
        onTestCaseUpdated: (handler) => connection.onNotification(TestUpdateNotification.type, handler),
    }

    /*connection.sendNotification(notification, 'Hello World');

    
    connection.onNotification(notification, (param: string) => {
        console.log("client:"+param); // This prints Hello World
    });

    connection.onUnhandledNotification(e => {
        console.log(e.jsonrpc); 
    });

    let notification2 = new rpc.NotificationType<string, void>('testNotification2');
    connection.onNotification(notification2, (param: string) => {
        console.log("client:"+param); // This prints Hello World
    });*/

    console.log("client connected");

    return result;
}



