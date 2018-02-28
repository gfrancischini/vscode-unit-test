import { RequestHandler, createMessageConnection, StreamMessageReader, StreamMessageWriter, NotificationType } from 'vscode-jsonrpc';
import {
    InitializeRequest, InitializeParams, InitializeResult, InitializeError,
    DiscoveryTestCasesRequest, DiscoveryTestCasesParams, DiscoveryTestCasesResult, DiscoveryTestCasesError,
    RunTestCasesRequest, RunTestCasesParams, RunTestCasesResult, RunTestCasesError,
    TestCaseUpdateNotification, TestCaseUpdateParams, 
    DataOutputNotification, DataOutputParams, 
    DebugInformationNotification,
    CancelNotification, CancelParams
} from "../../testLanguage/protocol"
import { TestCase, TestCaseStatus } from "../../testLanguage/protocol";
import * as path from "path";

export interface IConnection {

    listen(): void;
    initialize(params: InitializeParams): Thenable<InitializeResult>;
    discoveryTestCases(params: DiscoveryTestCasesParams): Thenable<DiscoveryTestCasesResult>;
    runTestCases(params: RunTestCasesParams): Thenable<RunTestCasesResult>;
    onTestCaseUpdated(handler: any): void;
    onDataOutput(handler: any): void;
    onDebugInformation(handler: any): void;
    cancelRequest(params: CancelParams) : void;
}


export class TestLanguageClient {
    protected connection: IConnection;

    public getConnection(): IConnection {
        return this.connection;
    }
  
    private createConnection(input: StreamMessageReader, output: StreamMessageWriter) {
        let msgConnection = createMessageConnection(input, output);

        let result: IConnection = {
            listen: (): void => msgConnection.listen(),
            initialize: (params: InitializeParams) => msgConnection.sendRequest(InitializeRequest.type, params),
            discoveryTestCases: (params: DiscoveryTestCasesParams) => msgConnection.sendRequest(DiscoveryTestCasesRequest.type, params),
            runTestCases: (params: RunTestCasesParams) => msgConnection.sendRequest(RunTestCasesRequest.type, params),
            onTestCaseUpdated: (handler) => msgConnection.onNotification(TestCaseUpdateNotification.type, handler),
            onDataOutput: (handler) => msgConnection.onNotification(DataOutputNotification.type, handler),
            onDebugInformation: (handler) => msgConnection.onNotification(DebugInformationNotification.type, handler),
            cancelRequest: (params: CancelParams) => msgConnection.sendNotification(CancelNotification.type, params),
        }

        return result;
    }

    public registerListeners() {
    }

    public listen(input: StreamMessageReader, output: StreamMessageWriter) {
        this.connection = this.createConnection(input, output);
        this.registerListeners();
        this.connection.listen();
    }
}