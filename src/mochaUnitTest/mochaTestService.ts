import * as vscode from "vscode";
import { getAllTestFilesInDirectory } from '../utils/directory'
import { MochaTestFinder } from './mochaTestFinder';
import { TestCase } from '../testTreeModel/testCase';
import Event, { Emitter } from "../base/common/Event";
import * as Collections from "typescript-collections";
import * as path from "path";
import { startServer } from "../mochaUnitTest/mochaProcess/mochaServerHelper";
import { connectClient } from "../mochaUnitTest/mochaClient";
import { TestCaseUpdateParams } from "./mochaProcess/mochaProtocol";
import { TestCaseCollection } from "./testCaseCollection"
import { InitializeRequest, InitializeParams, InitializeResult, TestUpdateNotification } from "./mochaProcess/mochaProtocol"


/**   
 * Class responsible for handling the test communication events 
 */
export class MochaTestService {
    private globPattern = "**/*.test.js";

    /**
     * The current test cases
     */
    private testCases = Array<TestCase>();

    public testCaseCollection: TestCaseCollection = new TestCaseCollection();

    public sessionId : number = 0;

    private directory : string = null;

    constructor(directory : string) {
        this.directory = directory;
        this._onDidTestCaseChanged = new Emitter<TestCase>();
        this.watchForWorkspaceFilesChange();
        
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

                this.testCases = new Array<TestCase>();

                testFilesPath.forEach((testFilePath, i) => {
                    progress.report({ message: `Discovering Tests: ${i}/${testFilesPath.length}` });
                    const results = MochaTestFinder.findTestCases(testFilePath);
                    this.testCaseCollection = results;
                });

                //todo: we need to findtest cases and them do the diff between new tests and excluded ones

                return resolve(this.testCases);
            });
        });
    }

    private childProcess;
    private connection;

    /**
     * Run a set of tests 
     * @param tests The set of test to run
     * @param debuggingEnabled 
     */
    public runTests(testCases: Array<TestCase>, debuggingEnabled: boolean = false) {
        this.sessionId++;
        if (this.childProcess == null) {
            this.childProcess = startServer("C:\\Git\\p1-my-reads\\src");
            this.connection = connectClient(this.childProcess);
        }

        const initializeParams: InitializeParams = {
            processId: 1,
            testCases,
            sessionId: this.sessionId,
        }

        this.connection.initialize(initializeParams).then((value: InitializeResult) => {
            console.log(value);
        });

        //testCases.forEach((testCase) => {
        //})
        this._onDidTestCaseChanged.fire(null);

        this.connection.onTestCaseUpdated((params: TestCaseUpdateParams): any => {
            console.log(params);

            let testCase: TestCase = Object.assign(new TestCase(), params.testCase);


            this.testCaseCollection.push(testCase);

            this._onDidTestCaseChanged.fire(testCase);
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