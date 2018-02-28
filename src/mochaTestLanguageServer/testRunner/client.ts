import { createClientSocketTransport, NotificationType, createMessageConnection, 
    MessageReader, MessageWriter } from 'vscode-jsonrpc';
import {
    RunRequest, RunParams, RunResult,
    TestSuiteUpdateNotification, TestSuiteUpdateParams
} from './protocol';
import { startMochaRunnerServer } from "./mochaCaller"
import * as fs from "fs"
import * as cp from "child_process";
import * as net from "net";

export interface IConnection {
    listen(): void;
    initialize(params: RunParams): Thenable<RunResult>;
    onTestSuiteUpdated(handler: any): void;
    onClose(handler: any): void;
    onError(handler:any) : void;
}

export class MochaRunnerClient {
    private connection: IConnection;

    private port: number;

    private childProcess: cp.ChildProcess = null;

    constructor(port: number) {
        this.port = port;
    }

    public getConnection(): IConnection {
        return this.connection;
    }

    private createConnection(reader : MessageReader, writer : MessageWriter): IConnection {
        // Use stdin and stdout for communication:
        let msgConnection = createMessageConnection(reader, writer);

        let result: IConnection = {
            listen: (): void => msgConnection.listen(),
            initialize: (params: RunParams) => msgConnection.sendRequest(RunRequest.type, params),
            onTestSuiteUpdated: (handler) => msgConnection.onNotification(TestSuiteUpdateNotification.type, handler),
            //onDataOutput: (handler) => msgConnection.onNotification(DataOutputNotification.type, handler),
            onClose: (handler)  => msgConnection.onClose(handler),
            onError: (handler)  => msgConnection.onError(handler),
        }

        return result;
    }

    /**
     * Open a server connection and wait for the client to connect
     */
    public connectClient(cwd: string, port: number, startServer: boolean = true): Promise<IConnection> {

        return new Promise<IConnection>((resolve, reject) => {
            console.log(`starting server on port = ${this.port}`);
            this.port = port;
            createClientSocketTransport(this.port).then((transport) => {
                if (startServer) {
                    this.startChildProcess(cwd, port)
                        .then((value) => {

                        });
                }

                transport.onConnected().then((protocol) => {
                    this.connection = this.createConnection(protocol[0], protocol[1]);
                    this.connection.listen();
                    resolve(this.connection);
                });
            });
        });
    }

    /**
     * Start a child process that will be our client?
     * @param cwd 
     * @param port 
     */
    public startChildProcess(cwd: string, port: number): Promise<boolean> {
        const mochaArgs = new Array<string>();
        this.childProcess = startMochaRunnerServer(cwd, port);

        return new Promise((resolve, reject) => {
            this.childProcess.on("close", () => {
                this.childProcess = null;
                resolve(true);
            })
        });
    }

    /**
     * Kill the child process
     */
    public stopChildProcess() {
        if (this.childProcess != null) {
            this.childProcess.kill("SIGINT");
        }
    }
}
