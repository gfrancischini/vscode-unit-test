import { createClientSocketTransport, NotificationType, createMessageConnection } from 'vscode-jsonrpc';
import { TestSuiteUpdateNotification, TestSuiteUpdateParams } from './protocol';
import { startMochaRunnerServer } from "./mochaCaller"
import * as fs from "fs"
import * as cp from "child_process";
import * as net from "net";

export interface IConnection {
    listen(): void;
    onTestSuiteUpdated(handler: any): void;
}

export class MochaRunnerClient {
    private connection: IConnection;

    private port: number;

    private childProcess: cp.ChildProcess = null;

    constructor(port : number) {
        this.port = port;
    }

    public getConnection(): IConnection {
        return this.connection;
    }

    private createConnection(reader, writer): IConnection {
        // Use stdin and stdout for communication:
        let msgConnection = createMessageConnection(reader, writer);

        let result: IConnection = {
            listen: (): void => msgConnection.listen(),
            onTestSuiteUpdated: (handler) => msgConnection.onNotification(TestSuiteUpdateNotification.type, handler),
            //onDataOutput: (handler) => msgConnection.onNotification(DataOutputNotification.type, handler),
        }

        return result;
    }

    public connectClient(): Promise<IConnection> {

        return new Promise<IConnection>((resolve, reject) => {
            createClientSocketTransport(this.port).then((transport) => {
                transport.onConnected().then((protocol) => {
                    this.connection = this.createConnection(protocol[0], protocol[1]);
                    this.connection.listen();
                    resolve(this.connection);
                });
            });
        });
    }

    public startServer(cwd, mochaPath, port): Promise<boolean> {
        const mochaArgs = new Array<string>();
        this.childProcess = startMochaRunnerServer(cwd, mochaPath, port, mochaArgs);

        return new Promise((resolve, reject) => {
            this.childProcess.on("close", () => {
                this.childProcess = null;
                resolve(true);
            })
        });
    }

    public stopServer() {
        if (this.childProcess != null) {
            this.childProcess.kill("-1");
        }
    }
}
