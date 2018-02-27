import * as vscode from "vscode";

import { TestCase, RunTestCasesResult, DiscoveryTestCasesResult, DataOutputParams, DebugInformationParams } from '../testLanguage/protocol';
import Event, { Emitter } from "../base/common/Event";
import * as Collections from "typescript-collections";
import * as path from "path";
import { startServer } from "../utils/server";
import { TestCaseCollection } from "./testCaseCollection"
import { TestLanguageClient } from "../testLanguage/client/testLanguageClient"
import { StreamMessageReader, StreamMessageWriter, SocketMessageReader } from 'vscode-jsonrpc';
import * as cp from 'child_process';
import * as throttle from "throttle-debounce/throttle";

import {
    InitializeParams, InitializeResult,
    TestCaseUpdateParams
} from "../testLanguage/protocol"

/**   
 * Class responsible for handling the test communication events 
 */
export class TestTreeLanguageClient extends TestLanguageClient {
    public testCaseCollection: TestCaseCollection = new TestCaseCollection();

    /**
     * The current running session id
     */
    public sessionId: number = 0;

    /**
     * The current directory where the extension is running
     */
    private directory: string = null;

    /**
     * The current provider settings
     */
    private providerSettings: any = null;

    /**
     * The test server process
     */
    private serverProcess: cp.ChildProcess;

    /**
     * Create the test result output channel
     */
    private testOutputChannel = vscode.window.createOutputChannel('Test');

    /**
     * vent notification emitted when test case change (new test, update)
     */
    private _onDidTestCaseChanged: Emitter<TestCase>;

    constructor(directory: string, providerSettings: any) {
        super();
        this.directory = directory;
        this.providerSettings = providerSettings;
        this._onDidTestCaseChanged = new Emitter<TestCase>();
        this.watchForWorkspaceFilesChange();
    }

    /**
    * Register a new listeener for the test changed
    */
    public get onDidTestCaseChanged(): Event<TestCase> {
        return this._onDidTestCaseChanged.event;
    }

    /** 
     * Initalize the client and start the test server
     */
    public initialize(): Thenable<InitializeResult> {
        this.serverProcess = startServer(this.directory);

        //our reader stream comes from fd = 3
        this.listen(new SocketMessageReader(<any>this.serverProcess.stdio[3]),
            new StreamMessageWriter(this.serverProcess.stdin));

        const initializeParams: InitializeParams = {
            rootPath: this.directory,
            processId: process.pid,
            settings: this.providerSettings
        }

        return this.connection.initialize(initializeParams);
    }

    /** 
     * Register server listener 
     */
    registerListeners() {
        super.registerListeners();

        const throttled = throttle(300, () => {
            // Throttled function 
            this._onDidTestCaseChanged.fire();
        });

        this.connection.onTestCaseUpdated((params: TestCaseUpdateParams): any => {
            let testCase: TestCase = Object.assign(new TestCase(), params.testCase);

            this.testCaseCollection.push(testCase);

            throttled();

        });

        this.connection.onDataOutput((params: DataOutputParams): any => {
            this.testOutputChannel.appendLine(params.data);
        });

        this.connection.onDebugInformation((params: DebugInformationParams): any => {
            const vscodeDebuggerOpts = params.data;

            vscode.debug.startDebugging(undefined, vscodeDebuggerOpts).then(data => {
                console.log(`debug status:${data}`);
            });

            /*vscode.debug.onDidTerminateDebugSession(() => {
                this.debuggerStatus = DebuggerStatus.Disconnected;
            });*/
        });
    }

    public watchForWorkspaceFilesChange() {
        /*const test = vscode.workspace.workspaceFolders[0].uri;
        let pattern = path.join(this.directory, this.globPattern);
        const fileSystemWatcher = vscode.workspace.createFileSystemWatcher("C:\\Git\\p1-my-reads\\src\\test\\App2.test.js");
        
        fileSystemWatcher.onDidChange((listener) => {
            this.discoveryWorkspaceTests(this.directory);
        })*/


    }

    /**
    * Discover the files in the given directory
    * @param directory The directory path do discvery the tests
    */
    public discoveryWorkspaceTests(directory: string): Promise<Array<TestCase>> {
        this.testOutputChannel.appendLine("Start test discovery");
        return <Promise<Array<TestCase>>>vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: "Test Adapter" }, progress => {
            this.testOutputChannel.appendLine(`Discovering Tests`);
            return new Promise((resolve, reject) => {
                return this.connection.discoveryTestCases({
                    directory: directory
                }).then((result: DiscoveryTestCasesResult) => {
                    result.testCases.forEach((testCase) => {
                        let convertedTestCase: TestCase = Object.assign(new TestCase(), testCase);
                        this.testCaseCollection.push(convertedTestCase);
                    });
                    this._onDidTestCaseChanged.fire(result.testCases[0]);

                    //todo: we need to findtest cases and them do the diff between new tests and excluded ones
                    this.testOutputChannel.appendLine("End of test discovery");
                    return resolve(result.testCases);
                });
            });
        });
    }


    /**
     * Run a set of tests 
     * @param tests The set of test to run
     * @param debuggingEnabled 
     */
    public runTests(testCases: Array<TestCase>, debuggingEnabled: boolean = false) {
        this.sessionId++;
        if (debuggingEnabled) {
            this.testOutputChannel.appendLine(`Debug tests for sessionId: ${this.sessionId}`);
        }
        else {
            this.testOutputChannel.appendLine(`Run tests for sessionId: ${this.sessionId}`);
        }

        this.testOutputChannel.show();
        vscode.window.withProgress(
            { location: vscode.ProgressLocation.Window, title: "Test Adapter" },
            progress => {
                progress.report({ message: `Running Tests` });
                return new Promise((resolve, reject) => {
                    this.connection.runTestCases({
                        sessionId: this.sessionId,
                        testCases,
                        debug: debuggingEnabled
                    }).then((result: RunTestCasesResult) => {
                        this._onDidTestCaseChanged.fire();

                        if(debuggingEnabled) {
                            vscode.commands.executeCommand("workbench.action.debug.stop");
                        }

                        this.testOutputChannel.appendLine("End of test running");
                        return resolve(null);
                    });
                });
            });
    }

    /** 
     * Stop the server
     */
    public stopServer() {
        this.serverProcess.kill("SIGINT");
    }
}