import { createServerSocketTransport, NotificationType, createMessageConnection } from 'vscode-jsonrpc';
import { TestSuiteUpdateNotification, TestSuiteUpdateParams } from './protocol';

export interface IConnection {
    listen(): void;
    testSuiteUpdate(params: TestSuiteUpdateParams): void;
    //dataOutput(params: DataOutputParams): void;
}

export class MochaRunnerServer {
    protected connection: IConnection;
    private port: number;

    constructor(port) {
        this.port = port;
    }

    public getConnection(): IConnection {
        return this.connection;
    }

    private createConnection(reader, writer) {
        let msgConnection = createMessageConnection(reader, writer);

        let result: IConnection = {
            listen: (): void => msgConnection.listen(),
            testSuiteUpdate: (params: TestSuiteUpdateParams) => msgConnection.sendNotification(TestSuiteUpdateNotification.type, params),
            //dataOutput: (params: DataOutputParams) => msgConnection.sendNotification(DataOutputNotification.type, params)
        }

        return result;
    }

    public connectServer(): Promise<IConnection> {
        return new Promise<IConnection>((resolve, reject) => {
            const protocol = createServerSocketTransport(this.port);

            this.connection = this.createConnection(protocol[0], protocol[1]);
                this.connection.listen();
                resolve(this.connection);
        });
    }
}
