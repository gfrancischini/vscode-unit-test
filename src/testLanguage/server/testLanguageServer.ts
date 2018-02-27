import { RequestHandler, createMessageConnection, MessageReader, MessageWriter, NotificationType } from 'vscode-jsonrpc';
import {
    InitializeRequest, InitializeParams, InitializeResult, InitializeError,
    RunTestCasesRequest,DiscoveryTestCasesRequest,
    TestCaseUpdateNotification, TestCaseUpdateParams,
    DataOutputNotification, DataOutputParams,
    DebugInformationNotification, DebugInformationParams
} from "../../testLanguage/protocol"
import { TestCase, TestCaseStatus } from "../../testLanguage/protocol";
import * as path from "path";

export interface IConnection {
    listen(): void;
    onInitialize(handler: any): void;
    onRunTestCases(handler: any): void;
    onDiscoveryTestCases(handler: any): void;
    testCaseUpdate(params: TestCaseUpdateParams): void;
    dataOutput(params: DataOutputParams): void;
    debugInformation(params: DebugInformationParams): void;
}


export class TestLanguageServer {
    protected connection: IConnection;
    protected initializeParams : InitializeParams;

    public getConnection(): IConnection {
        return this.connection;
    }

    private createConnection(input: MessageReader, output: MessageWriter) {
        let msgConnection = createMessageConnection(input, output);
        
        let result: IConnection = {
            listen: (): void => msgConnection.listen(),
            onInitialize: (handler) => msgConnection.onRequest(InitializeRequest.type, handler),
            onRunTestCases: (handler) => msgConnection.onRequest(RunTestCasesRequest.type, handler),
            onDiscoveryTestCases: (handler) => msgConnection.onRequest(DiscoveryTestCasesRequest.type, handler),
            testCaseUpdate: (params: TestCaseUpdateParams) => msgConnection.sendNotification(TestCaseUpdateNotification.type, params),
            dataOutput: (params: DataOutputParams) => msgConnection.sendNotification(DataOutputNotification.type, params),
            debugInformation: (params: DebugInformationParams) => msgConnection.sendNotification(DebugInformationNotification.type, params)
        }

        return result;
    }

    public registerListeners() {
        this.connection.onInitialize((params: InitializeParams): InitializeResult => {
            this.initializeParams = params;
            return {
                success: true,
                version: "0.0.1",
                customResults: { "success": "The server was successfully initialized" }
            };
        });

    }

    public listen(input: MessageReader, output: MessageWriter) {
        this.connection = this.createConnection(input, output);
        this.registerListeners();
        this.connection.listen();
    }
}