import * as vscode from "vscode";
import { TestCase } from "../testTreeModel/testCase"
import { TestOutcome } from "../testTreeModel/testCaseResult"
import { TreeLabel } from "../testTreeModel/treeLabel"
import { GroupByProvider } from "./groupByProvider"
import { isExtensionEnabled, isAutoInitializeEnabled } from "../utils/vsconfig"
import { getImageResource } from "../utils/image"
import { MochaTestService } from "../mochaUnitTest/mochaTestService"
import * as Collections from "typescript-collections";

export function RegisterVSTestTreeProvider(context: vscode.ExtensionContext) {
    let testTreeDataProvider: TestTreeDataProvider;
    testTreeDataProvider = new TestTreeDataProvider(context);
    vscode.window.registerTreeDataProvider("unit.test.explorer.vsTestTree", testTreeDataProvider);
}


/**
 * Type that the tree provider handles
 */
type TestTreeType = TreeLabel | TestCase;

/**
 * Additional data to help the tree data provider
 */
class TestAdditionalData {
    collapsibleState: vscode.TreeItemCollapsibleState;
}

export class TestTreeDataProvider implements vscode.TreeDataProvider<TestTreeType> {
    public _onDidChangeTreeData: vscode.EventEmitter<TestTreeType | null> = new vscode.EventEmitter<TestTreeType | null>();
    readonly onDidChangeTreeData: vscode.Event<TestTreeType | null> = this._onDidChangeTreeData.event;

    /**
     * The test service to discover and run tests
     */
    private testService: MochaTestService;

    /**
     * Group by filter provider that categorizes the test cases
     */
    private groupByFilter: GroupByProvider = new GroupByProvider();

    private testsAdditionalData: Collections.Dictionary<string, TestAdditionalData> = new Collections.Dictionary<string, TestAdditionalData>();

    private rootDir = "C:\\Git\\p1-my-reads\\src\\test";

    /**
     * Get children method that must be implemented by test tree provider
     * @param item The test case to draw on the test tree
     */
    public getChildren(item?: TestTreeType): Thenable<TestTreeType[]> {
        /*if (this.isTestExplorerInitialized === false) {
            return this.getTestExplorerNotInitialized();
        }*/

        // if the testcase exists then resolve it children
        if (item) {
            if (item instanceof TreeLabel) {
                return Promise.resolve(item.getChildren() ? item.getChildren() : []);
            }
            const filtered = this.testService.testCaseCollection.testCasesDictionary.values().filter((testCase) => {
                return testCase.parendId === item.getId();
            });
            return Promise.resolve(filtered);
        }
        else {
            // if testcase = null means that we are in the root
            //const filtered = this.testService.testCaseCollection.testCasesDictionary.values().filter((testCase) => {
            //    return testCase.parendId == null;
            //})

            return this.groupByFilter.getSelected().getCategories(this.testService.testCaseCollection.testCasesDictionary.values());
        }
    }

    /**
     * Render the test item
     * @param item The item that will be rendered 
     */
    public getTreeItem(item: TestTreeType): vscode.TreeItem {
        return <vscode.TreeItem>{
            label: item.title,
            collapsibleState: this.getItemCollapsibleState(item),
            command: {
                command: "vstest.explorer.open",
                arguments: [item],
                title: item.title,
            },
            iconPath: this.getIcon(item)
        };
    }


    /**
     * The item to get the icon
     * @param item 
     */
    private getIcon(item: TestTreeType) {
        if (item instanceof TreeLabel) {
            return null;
        }

        if (item instanceof TestCase) {
            //if (item.isRunning()) {
            //    return getImageResource("progress.svg");
            //}

            let appendStringIcon = "";
            if (item.result.sessionId != this.testService.sessionId) {
                appendStringIcon = "_previousExec";
            }
            const outcome = item.result ? item.result.status : TestOutcome.None;
            switch (outcome) {
                case TestOutcome.FatalFailure:
                case TestOutcome.Failed:
                    return getImageResource(`error${appendStringIcon}.svg`);
                case TestOutcome.None:
                    return getImageResource(`exclamation.svg`);
                case TestOutcome.NotFound:
                    return getImageResource("interrogation.svg");
                case TestOutcome.Passed:
                    return getImageResource(`checked${appendStringIcon}.svg`);
                case TestOutcome.Skipped:
                    return getImageResource(`skipped${appendStringIcon}.svg`);
                case TestOutcome.Running:
                    return getImageResource(`progress.svg`);
            }
        }
        return getImageResource("interrogation.svg");
    }


    /** 
     * Called when discovery test is needed
     */
    private discoveryTests() {
        this.testService.discoveryWorkspaceTests(this.rootDir).then((testCases) => {
            this._onDidChangeTreeData.fire();
            //this.testService.runTests(this.testService.testCaseCollection.testCasesDictionary.values());
        });
    }


    /**
     * Get tree item collapsible
     * @param item 
     */
    private getItemCollapsibleState(item: TestTreeType) {
        const treeItemAdditionalInfo: TestAdditionalData = this.testsAdditionalData.getValue(item.getId());
        if (treeItemAdditionalInfo) {
            return treeItemAdditionalInfo.collapsibleState;
        }

        if (item instanceof TreeLabel) {
            return vscode.TreeItemCollapsibleState.Expanded;
        }

        const hasChildren: boolean = this.testService.testCaseCollection.testCasesDictionary.values().some((testCase) => {
            return testCase.parendId === item.getId();
        });

        return hasChildren ? vscode.TreeItemCollapsibleState.Collapsed : null;
    }


    /**
     * Create a no test found label
     */
    private createNoTestFoundLabel() {
        const noTestFoundLabel: TreeLabel = new TreeLabel("No Test Found", TestOutcome.None, null);
        return Promise.resolve([noTestFoundLabel]);
    }



    /**
     * Run when the group by command is called
     */
    private onCommandGroupBy() {
        this.groupByFilter.show().then(() => {
            this.refrehTestExplorer(null);
        })
    }


    /** 
     * Method used to register test service listener like onDitTestCaseChanged 
     */
    private registerTestServiceListeners() {
        this.testService.onDidTestCaseChanged((test: TestCase) => {
            this._onDidChangeTreeData.fire();
        });
    }

    private onCommandGoToTestLocation(item: TestTreeType) {
        //this.toggleItemCollapsibleState(item);
        //this.selectedItem = item;

        if (item instanceof TestCase) {

            const uri: string = item.path;
            vscode.workspace.openTextDocument(uri).then(result => {
                vscode.window.showTextDocument(result);
                const editor = vscode.window.activeTextEditor;

                //decrement 1 here because vscode is 0 base line index
                const range = editor.document.lineAt(item.line).range;
                editor.selection = new vscode.Selection(range.start, range.start);
                editor.revealRange(range);
            });
        }
    }

    private runTest(item: TestTreeType) {
        if (item instanceof TreeLabel) {
            this.testService.runTests(item.getChildren());
        }
        else {
            const testCases = this.findAllChildrens(item.getId());
            testCases.push(item);
            this.testService.runTests(testCases);
        }
    }

    findAllParents() {

    }

    findAllChildrens(parentId: string): Array<TestCase> {
        const testCases: Array<TestCase> = new Array<TestCase>();

        const filtered = this.testService.testCaseCollection.testCasesDictionary.values().filter((testCase) => {
            return testCase.parendId === parentId;
        })

        testCases.push(...filtered);

        filtered.forEach((testCase) => {
            testCases.push(...this.findAllChildrens(testCase.getId()));
        })

        return testCases;
    }

    /**
     * Register test explorer commands
     * @param context 
     */
    private registerCommands(context: vscode.ExtensionContext) {

        //register the go to test location command
        const goToTestLocationCommand = vscode.commands.registerCommand("unit.test.explorer.open",
            (event) => this.onCommandGoToTestLocation(event));
        context.subscriptions.push(goToTestLocationCommand);

        //register the group by explorer command
        const groupByExplorerCommand = vscode.commands.registerCommand("unit.test.explorer.groupBy",
            () => this.onCommandGroupBy());
        context.subscriptions.push(groupByExplorerCommand);

        //register the refresh explorer command
        const refreshExplorerCommand = vscode.commands.registerCommand("unit.test.explorer.refresh",
            () => this.discoveryTests());
        context.subscriptions.push(refreshExplorerCommand);

        const runCommand = vscode.commands.registerCommand("unit.test.execution.runSelected",
            (item) => {
                if (item) {
                    this.runTest(item);
                }
                //else {
                //    this.runTests(this.selectedItem);
                //}
            });
        context.subscriptions.push(runCommand);

        //register the show test case result command
        const showTestResultCommand = vscode.commands.registerCommand("unit.test.explorer.showResult",
            event => this.onCommandShowTestCaseResult(event));
        context.subscriptions.push(showTestResultCommand);


        /*
                const debugCommand = vscode.commands.registerCommand("vstest.execution.debugSelected",
                    (item) => {
                        if (item) {
                            this.debugTests(item);
                        }
                        else {
                            this.debugTests(this.selectedItem);
                        }
                    });
                context.subscriptions.push(debugCommand);
        
                const restartExplorerCommand = vscode.commands.registerCommand("vstest.explorer.restart",
                    () => this.restart());
                context.subscriptions.push(restartExplorerCommand);
        
        
        
                
        
                const runAllTestCommand = vscode.commands.registerCommand("vstest.execution.runAll",
                    () => this.runAllTests());
                context.subscriptions.push(runAllTestCommand);
        
                const initializeTestExplorer = vscode.commands.registerCommand("vstest.explorer.initialize", event => this.initialize());
                context.subscriptions.push(showTestResult);*/
    }
    private testOutputChannel = vscode.window.createOutputChannel('Test');
    private onCommandShowTestCaseResult(item: TestTreeType) {
        if (item instanceof TestCase) {
            this.testOutputChannel.clear();

            this.testOutputChannel.appendLine(item.title);
            this.testOutputChannel.appendLine(`Duration: ${item.result.duration}`);
            this.testOutputChannel.appendLine(`Start Time: ${item.result.startTime}`);
            this.testOutputChannel.appendLine(`End Time: ${item.result.endTime}`);

            if (item.result.status === TestOutcome.Failed) {
                this.testOutputChannel.appendLine(`Error: ${item.result.errorMessage}`);
                this.testOutputChannel.appendLine(`Stack Trace: ${item.result.errorStackTrace}`);
            }
        }
    }

    /**
     * 
     */
    constructor(private context: vscode.ExtensionContext) {
        this.testService = new MochaTestService(this.rootDir);

        this.registerCommands(context);

        this.registerTestServiceListeners();

        this.discoveryTests();

        /*vscode.workspace.onDidChangeConfiguration(() => {
            //this.testService.updateConfiguration(getCurrentAdapterName(), getConfigurationForAdatper());
            this.registerTestModelListeners();
            this.refrehTestExplorer(null);
            this.discoveryTests();
        });*/
    }




    private refrehTestExplorer(test: TestCase) {
        this._onDidChangeTreeData.fire(test);
    }





    private toggleItemCollapsibleState(item: TestTreeType) {
        /*const treeItemAdditionalInfo: TestAdditionalData = this.testsAdditionalData.getValue(test.getId());
        if (!treeItemAdditionalInfo) {
            return;
        }
        switch (treeItemAdditionalInfo.collapsibleState) {
            case vscode.TreeItemCollapsibleState.None:
                break;
            case vscode.TreeItemCollapsibleState.Collapsed:
                treeItemAdditionalInfo.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
                break;
            case vscode.TreeItemCollapsibleState.Expanded:
                treeItemAdditionalInfo.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                break;
        }
        */

    }
}