import * as vscode from "vscode";
import * as cp from 'child_process';
import * as throttle from "throttle-debounce/throttle";
import * as debounce from "throttle-debounce/debounce";
import * as Collections from "typescript-collections";
import * as path from "path";

import { TestCase, RunTestCasesResult, DiscoveryTestCasesResult, DataOutputParams, DebugInformationParams } from './testLanguage/protocol';
import { startServer } from "./utils/server";
import { TestCaseCollection } from "./testCaseCollection"
import { TestLanguageClient } from "./testLanguage/client/testLanguageClient"
import { StreamMessageReader, StreamMessageWriter, SocketMessageReader } from 'vscode-jsonrpc';
import { PathUtils } from "./utils/path"
import { getwatchInterval } from "./utils/vsconfig"
import {
    InitializeParams, InitializeResult,
    TestCaseUpdateParams, FileChangeType, FileChangeParams
} from "./testLanguage/protocol"
import { RunRequest } from "./mochaTestLanguageServer/testRunner/protocol";

/**
 * Create the test result output channel
 */
const testOutputChannel = vscode.window.createOutputChannel('Test');

/**   
 * Class responsible for handling the test communication events 
 */
export class TestClient extends TestLanguageClient {
    public testCaseCollection: TestCaseCollection = new TestCaseCollection();

    /**
     * The current running session id
     */
    public sessionId: number = 0;

    /**
     * The current directory where the extension is running
     */
    protected directory: string = null;

    /**
     * The current provider settings
     */
    protected providerSettings: any = null;

    /**
     * The test server process
     */
    protected serverProcess: cp.ChildProcess;

    /**
     * Create the test result output channel
     */
    protected testOutputChannel = testOutputChannel;

    /**
     * vent notification emitted when test case change (new test, update)
     */
    protected _onDidTestCaseChanged: vscode.EventEmitter<TestCase>;

    constructor(directory: string, providerSettings: any) {
        super();
        this.directory = directory;
        this.providerSettings = providerSettings;
        this._onDidTestCaseChanged = new vscode.EventEmitter<TestCase>();
    }

    /**
    * Register a new listeener for the test changed
    */
    public get onDidTestCaseChanged(): vscode.Event<TestCase> {
        return this._onDidTestCaseChanged.event;
    }

    /** 
     * Initalize the client and start the test server
     */
    public initialize(): Thenable<InitializeResult> {
        this.testOutputChannel.appendLine(`Starting server`);

        this.serverProcess = startServer(this.directory);

        //our reader stream comes from fd = 3
        this.listen(new SocketMessageReader(<any>this.serverProcess.stdio[3]),
            new StreamMessageWriter(this.serverProcess.stdin));

        const initializeParams: InitializeParams = {
            rootPath: this.directory,
            processId: process.pid,
            settings: this.providerSettings
        }

        return new Promise((resolve, reject) => {
            this.connection.initialize(initializeParams).then((result: InitializeResult) => {
                if (result.watchFilesGlob) {
                    this.watchForWorkspaceFilesChange(result.watchFilesGlob);
                }
                resolve(result);
            });
        });

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

    protected fileChanges = new Array<FileChangeParams>();

    public fileChangesDebounced = debounce(getwatchInterval(), () => {
        this.discoveryWorkspaceTests(null, this.fileChanges);
        this.fileChanges = new Array<FileChangeParams>();
    });


    public watchForWorkspaceFilesChange(glob: string) {
        const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(glob);

        fileSystemWatcher.onDidChange((uri: vscode.Uri) => {
            this.fileChanges.push({
                type: FileChangeType.Change,
                path: PathUtils.normalizePath(uri.fsPath)
            })
            this.fileChangesDebounced();
        });

        fileSystemWatcher.onDidCreate((uri: vscode.Uri) => {
            this.fileChanges.push({
                type: FileChangeType.Create,
                path: PathUtils.normalizePath(uri.fsPath)
            })
            this.fileChangesDebounced();
        });

        fileSystemWatcher.onDidDelete((uri: vscode.Uri) => {
            this.fileChanges.push({
                type: FileChangeType.Delete,
                path: PathUtils.normalizePath(uri.fsPath)
            });
            this.fileChangesDebounced();
        });
    }

    /**
    * Discover the files in the given directory
    * @param directory The directory path do discvery the tests
    */
    public discoveryWorkspaceTests(directory: string, fileChanges?: Array<FileChangeParams>): Promise<Array<TestCase>> {
        this.testOutputChannel.appendLine("Start test discovery");

        return <Promise<Array<TestCase>>>vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: "Test Adapter" }, progress => {
            this.testOutputChannel.appendLine(`Discovering Tests`);
            return new Promise((resolve, reject) => {
                return this.connection.discoveryTestCases({
                    directory: directory,
                    fileChanges: fileChanges
                }).then((result: DiscoveryTestCasesResult) => {
                    this.testCaseCollection.testCasesDictionary.clear();
                    result.testCases.forEach((testCase) => {
                        let convertedTestCase: TestCase = Object.assign(new TestCase(), testCase);
                        this.testCaseCollection.push(convertedTestCase);
                    });
                    this._onDidTestCaseChanged.fire();

                    this.testOutputChannel.appendLine(`Discovered ${result.testCases.length} tests`);

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

                        if (debuggingEnabled) {
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
        this.testOutputChannel.appendLine(`Killing server`);
        this.serverProcess.kill("SIGINT");
    }

    /** 
     * Send the command for stop the running tests 
     */
    public stopRunningTests() {
        this.testOutputChannel.appendLine(`Cancelling running tests`);
        this.connection.cancelRequest({ requestType: RunRequest.type.method });
    }
}