import * as vscode from "vscode";
import { getAllTestFilesInDirectory } from '../utils/directory'
import { TestCase, RunTestCasesResult, DiscoveryTestCasesResult, DataOutputParams } from '../testLanguage/protocol';
import Event, { Emitter } from "../base/common/Event";
import * as Collections from "typescript-collections";
import * as path from "path";
import { startServer } from "../utils/server";
import { TestCaseCollection } from "./testCaseCollection"
import { TestLanguageClient } from "../testLanguage/client/testLanguageClient"
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc';
import { getMochaGlob, getMochaOptsPath } from "../utils/vsconfig";
var throttle = require('throttle-debounce/throttle');

import {
    InitializeParams, InitializeResult,
    TestCaseUpdateParams
} from "../testLanguage/protocol"

enum DebuggerStatus {
    Disconnected,
    Attaching,
    Attached
}

/**   
 * Class responsible for handling the test communication events 
 */
export class TestTreeLanguageClient extends TestLanguageClient {
    private globPattern = "src/**/*.test.js";


    public testCaseCollection: TestCaseCollection = new TestCaseCollection();

    public sessionId: number = 0;

    private directory: string = null;

    private debuggerStatus: DebuggerStatus = DebuggerStatus.Disconnected;

    /**
     * Create the test result output channel
     */
    private testOutputChannel = vscode.window.createOutputChannel('Test');

    constructor(directory: string) {
        super();
        this.globPattern = getMochaGlob();
        this.directory = directory;
        this._onDidTestCaseChanged = new Emitter<TestCase>();
        this.watchForWorkspaceFilesChange();
    }


    public async initialize(): Promise<string> {
        const childProcess = startServer(this.directory);

        this.listen(new StreamMessageReader(childProcess.stdout),
            new StreamMessageWriter(childProcess.stdin));

        const initializeParams: InitializeParams = {
            processId: 1,
            optsPath: path.join(this.directory, getMochaOptsPath())
        }

        let version = null;
        await this.connection.initialize(initializeParams).then((result: InitializeResult) => {
            console.log(result);
            version = result.version;
        });
        return Promise.resolve(version);
    }

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

            return new Promise((resolve, reject) => {
                const testFilesPath = getAllTestFilesInDirectory(directory, this.globPattern);

                testFilesPath.forEach((testFilePath, i) => {
                    const message = `Discovering Tests: ${i + 1}/${testFilesPath.length}`;
                    progress.report({ message });
                    this.testOutputChannel.appendLine(`${message} - ${testFilePath}`);
                    this.connection.discoveryTestCases({
                        filePaths: [testFilePath]
                    }).then((result: DiscoveryTestCasesResult) => {
                        result.testCases.forEach((testCase) => {
                            let convertedTestCase: TestCase = Object.assign(new TestCase(), testCase);
                            this.testCaseCollection.push(convertedTestCase);
                        });
                        this._onDidTestCaseChanged.fire(result.testCases[0]);
                    });
                });

                //todo: we need to findtest cases and them do the diff between new tests and excluded ones
                this.testOutputChannel.appendLine("End of test discovery");
                return resolve(null);
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
                    this.attachDebugToTestCases(debuggingEnabled).then(result => {
                        this.connection.runTestCases({
                            sessionId: this.sessionId,
                            testCases,
                            debug: debuggingEnabled
                        }).then((result: RunTestCasesResult) => {
                            this._onDidTestCaseChanged.fire();
                            this.testOutputChannel.appendLine("End of test running");
                            vscode.commands.executeCommand("workbench.action.debug.stop");
                            return resolve(null);
                        });
                    })


                });
            });
    }

    public attachDebugToTestCases(debuggingEnabled: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (debuggingEnabled === false || this.debuggerStatus === DebuggerStatus.Attached) {
                resolve(true);
            }
            else if (this.debuggerStatus === DebuggerStatus.Disconnected) {
                this.debuggerStatus = DebuggerStatus.Attaching;
                //todo: this options should be loaded from a file contributed by the extension
                let vscodeDebuggerOpts = {
                    "name": "Mocha Tests",
                    "type": "node",
                    "request": "launch",
                    "stopOnEntry": false,
                    "address": "localhost",
                    "port": 9220,
                    "runtimeExecutable": null
                };

                vscode.debug.startDebugging(undefined, vscodeDebuggerOpts).then(data => {
                    console.log(`debug status:${data}`);
                    this.debuggerStatus = DebuggerStatus.Attached;
                    resolve(true);

                });

                vscode.debug.onDidTerminateDebugSession(() => {
                    this.debuggerStatus = DebuggerStatus.Disconnected;
                    resolve(false);
                });
            }
        });
    }

    /**
     * vent notification emitted when test case change (new test, update)
     */
    private _onDidTestCaseChanged: Emitter<TestCase>;

    /**
     * Register a new listeener for the test changed
     */
    public get onDidTestCaseChanged(): Event<TestCase> {
        return this._onDidTestCaseChanged.event;
    }


}