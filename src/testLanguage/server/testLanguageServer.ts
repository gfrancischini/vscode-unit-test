import { RequestHandler, createMessageConnection, StreamMessageReader, StreamMessageWriter, NotificationType } from 'vscode-jsonrpc';
import {
    InitializeRequest, InitializeParams, InitializeResult, InitializeError,
    RunTestCasesRequest,
    TestCaseUpdateNotification, TestCaseUpdateParams
} from "../../testLanguage/protocol"
import { TestCase, TestCaseStatus } from "../../testLanguage/protocol";
import * as path from "path";

export interface IConnection {
    listen(): void;
    onInitialize(handler: any): void;
    onRunTestCases(handler: any): void;
    testCaseUpdate(params: TestCaseUpdateParams): void;
}


export class TestLanguageServer {
    protected connection: IConnection;

    public getConnection(): IConnection {
        return this.connection;
    }

    private createConnection(input: StreamMessageReader, output: StreamMessageWriter) {
        let msgConnection = createMessageConnection(input, output);

        let result: IConnection = {
            listen: (): void => msgConnection.listen(),
            onInitialize: (handler) => msgConnection.onRequest(InitializeRequest.type, handler),
            onRunTestCases: (handler) => msgConnection.onRequest(RunTestCasesRequest.type, handler),
            testCaseUpdate: (params: TestCaseUpdateParams) => msgConnection.sendNotification(TestCaseUpdateNotification.type, params)

        }

        return result;
    }

    public registerListeners() {
        this.connection.onInitialize((params: InitializeParams): InitializeResult => {
            return {
                success: true,
                version: "0.0.1",
                customResults: { "success": "The server was successfully initialized" }
            };
        });

    }

    public listen(input: StreamMessageReader, output: StreamMessageWriter) {
        this.connection = this.createConnection(input, output);
        this.registerListeners();
        this.connection.listen();
    }
}