import * as vscode from "vscode";
import { getAllTestFilesInDirectory } from '../utils/directory'
import { MochaTestFinder } from './mochaTestFinder';
import { TestCase, RunTestCasesResult } from '../testLanguage/protocol';
import Event, { Emitter } from "../base/common/Event";
import * as Collections from "typescript-collections";
import * as path from "path";
import { startServer } from "../mochaUnitTest/mochaProcess/mochaServerHelper";
import { TestCaseCollection } from "./testCaseCollection"
import { TestLanguageClient } from "../testLanguage/client/testLanguageClient"
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc';

import {
    InitializeParams, InitializeResult,
    TestCaseUpdateParams
} from "../testLanguage/protocol"

/**   
 * Class responsible for handling the test communication events 
 */
export class TestTreeLanguageClient extends TestLanguageClient {
    private globPattern = "**/*.test.js";


    public testCaseCollection: TestCaseCollection = new TestCaseCollection();

    public sessionId: number = 0;

    private directory: string = null;

    constructor(directory: string) {
        super();
        this.directory = directory;
        this._onDidTestCaseChanged = new Emitter<TestCase>();
        this.watchForWorkspaceFilesChange();

    }


    public async initialize(): Promise<string> {
        const childProcess = startServer(this.directory);

        this.listen(new StreamMessageReader(childProcess.stdout),
            new StreamMessageWriter(childProcess.stdin));

        const initializeParams: InitializeParams = {
            processId: 1
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

        this.connection.onTestCaseUpdated((params: TestCaseUpdateParams): any => {
            console.log(params);

            let testCase: TestCase = Object.assign(new TestCase(), params.testCase);

            this.testCaseCollection.push(testCase);

            this._onDidTestCaseChanged.fire(testCase);
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
        return <Promise<Array<TestCase>>>vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: "Test Adapter" }, progress => {

            return new Promise((resolve, reject) => {
                const testFilesPath = getAllTestFilesInDirectory(directory, this.globPattern);

                testFilesPath.forEach((testFilePath, i) => {
                    progress.report({ message: `Discovering Tests: ${i}/${testFilesPath.length}` });
                    const results = MochaTestFinder.findTestCases(testFilePath);
                    this.testCaseCollection = results;
                });

                //todo: we need to findtest cases and them do the diff between new tests and excluded ones

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



        this.connection.runTestCases({
            sessionId: this.sessionId,
            testCases
        }).then((result: RunTestCasesResult) => {

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