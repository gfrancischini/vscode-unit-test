import * as vscode from "vscode";


import { TestCase, TestCaseStatus, InitializeResult } from "./testLanguage/protocol"
import { TestTreeType } from "./testTreeProvider/treeType"
import { TestClient } from "./testClient"
import { TreeLabel } from "./testTreeProvider/treeLabel"
import { isExtensionEnabled, isAutoInitializeEnabled, getCurrentTestProviderName, getTestProviderSettings, readSettings } from "./utils/vsconfig"



export enum TestLanguageStatus {
    None,
    Initializing,
    FindingTests,
    Ready
}


export class TestProvider {
    public status: TestLanguageStatus = TestLanguageStatus.None
    /**
     * Create the test result output channel
     */
    private testResultOutputChannel = vscode.window.createOutputChannel('Test Result');

    private directory: string;
    public client: TestClient;

    /**
     * vent notification emitted when test case change (new test, update)
     */
    protected _onDidTestCaseChanged: vscode.EventEmitter<TestCase>;

    constructor(private context: vscode.ExtensionContext) {
        //todo: bug here when there is more than one workspace folders
        //super
        //this.rootDir = vscode.workspace.workspaceFolders[0].uri.fsPath;

        this._onDidTestCaseChanged = new vscode.EventEmitter<TestCase>();

        this.registerBasicCommands(context);

        this.registerServerCommands(context);

        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("unit.test")) {
                //restart server due to configuration changes
                this.onCommandRestartServer();
            }
        });
    }

    /**
     * Register a new listeener for the test changed
     */
    public get onDidTestCaseChanged(): vscode.Event<TestCase> {
        return this._onDidTestCaseChanged.event;
    }


    public initialize(): Promise<InitializeResult> {
        return new Promise<InitializeResult>((resolve, reject) => {
            this.directory = vscode.workspace.workspaceFolders[0].uri.fsPath;
            this.client = new TestClient(this.directory, readSettings(vscode.workspace.workspaceFolders[0].uri));

            this.client.initialize().then((result: InitializeResult) => {
                this.status = TestLanguageStatus.Initializing;
                console.log("initalizeResult: " + JSON.stringify(result));

                resolve(result)
            });

            this.client.testCaseCollection.onDidTestCaseCollectionChanged(() => {
                this._onDidTestCaseChanged.fire();
            });
        });
    }


    /**
     * Open the test case location
     * @param item 
     */
    private onCommandGoToTestLocation(item: TestTreeType) {
        if (item instanceof TestCase) {

            const uri: string = item.path;
            vscode.workspace.openTextDocument(uri).then(result => {
                vscode.window.showTextDocument(result);
                const editor = vscode.window.activeTextEditor;

                const range = editor.document.lineAt(item.line).range;
                editor.selection = new vscode.Selection(range.start, range.start);
                editor.revealRange(range);
            });
        }
    }

    /**
     * Command for run all test cases
     * @param If debugging is enabled
     */
    private onCommandRunAllTests(debug: boolean = false) {
        const filtered = this.client.testCaseCollection.testCasesDictionary.values().filter((testCase) => {
            return testCase.parentId == null;
        })

        this.client.runTests(filtered, debug);
    }

    /** 
     * Called when discovery test is needed
     */
    public discoveryTests() {
        vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: "Test Adapter" }, progress => {
            this.status = TestLanguageStatus.FindingTests;
            return this.client.discoveryWorkspaceTests(this.directory).then((testCases) => {
                this.status = TestLanguageStatus.Ready;
                this._onDidTestCaseChanged.fire();
            });
        });
    }

    /**
     * Run a specific test case item
     * @param item 
     */
    private runTest(item: TestTreeType, debug: boolean = false) {
        vscode.window.withProgress(
            { location: vscode.ProgressLocation.Window, title: "Test Adapter" },
            progress => {
                progress.report({ message: `Running Tests` });

                let toRunTestCases = null;
                if (item instanceof TreeLabel) {
                    toRunTestCases = item.children;
                }
                else {
                    toRunTestCases = this.client.testCaseCollection.findAllChildrens(item.id);
                    toRunTestCases.push(item);

                }

                return this.client.runTests(toRunTestCases, debug).then(() => {
                    this._onDidTestCaseChanged.fire();
                });
            });
    }

    private registerBasicCommands(context: vscode.ExtensionContext) {
        //register the refresh explorer command
        const refreshExplorerCommand = vscode.commands.registerCommand("unit.test.explorer.refresh",
            () => this.discoveryTests());
        context.subscriptions.push(refreshExplorerCommand);

        //register the refresh explorer command
        const restartExplorerCommand = vscode.commands.registerCommand("unit.test.explorer.restart",
            () => this.onCommandRestartServer());
        context.subscriptions.push(restartExplorerCommand);
    }

    /**
     * Register test explorer commands
     * @param context 
     */
    private registerServerCommands(context: vscode.ExtensionContext) {

        //register the go to test location command
        const goToTestLocationCommand = vscode.commands.registerCommand("unit.test.explorer.open",
            (event) => this.onCommandGoToTestLocation(event));
        context.subscriptions.push(goToTestLocationCommand);

        //register the run selected test command
        const runTestCommand = vscode.commands.registerCommand("unit.test.execution.runSelected",
            (item) => { item ? this.runTest(item) : null });
        context.subscriptions.push(runTestCommand);

        //register the run selected test command
        const debugTestCommand = vscode.commands.registerCommand("unit.test.execution.debugSelected",
            (item) => { item ? this.runTest(item, true) : null });
        context.subscriptions.push(debugTestCommand);

        //register the show test case result command
        const showTestResultCommand = vscode.commands.registerCommand("unit.test.explorer.openTestResult",
            event => this.onCommandOpenTestCaseResult(event));
        context.subscriptions.push(showTestResultCommand);

        //register the run all test cases command
        const runAllTestCommand = vscode.commands.registerCommand("unit.test.execution.runAll",
            () => this.onCommandRunAllTests(false));
        context.subscriptions.push(runAllTestCommand);

        //register the debug all test cases command
        const debugAllTestCommand = vscode.commands.registerCommand("unit.test.execution.debugAll",
            () => this.onCommandRunAllTests(true));
        context.subscriptions.push(debugAllTestCommand);

        //register the stop test running command
        const stopTestCommand = vscode.commands.registerCommand("unit.test.execution.stop",
            () => this.onCommandStopTests());
        context.subscriptions.push(stopTestCommand);

    }

    private onCommandStopTests() {
        this.client.stopRunningTests();
    }

    private onCommandRestartServer() {
        this.status = TestLanguageStatus.None;
        this.client.stopServer();

        this.initialize().then(() => {
            this.discoveryTests();
        })
    }

    /**
     * Open the output panel test case result and show the test case result
     * @param item 
     */
    private onCommandOpenTestCaseResult(item: TestTreeType) {
        if (item instanceof TestCase) {
            this.testResultOutputChannel.clear();
            this.testResultOutputChannel.show(true);
            this.testResultOutputChannel.appendLine(item.title);
            this.testResultOutputChannel.appendLine(`Source: ${item.path}:${item.line}:${item.column}`);

            if (item.status != TestCaseStatus.None) {
                this.testResultOutputChannel.appendLine(`Duration: ${item.duration}`);
                this.testResultOutputChannel.appendLine(`Start Time: ${item.startTime}`);
                this.testResultOutputChannel.appendLine(`End Time: ${item.endTime}`);

                if (item.status === TestCaseStatus.Failed) {
                    this.testResultOutputChannel.appendLine(`Error: ${item.errorMessage}`);
                    this.testResultOutputChannel.appendLine(`Stack Trace: ${item.errorStackTrace}`);
                }
            }
        }
    }
}