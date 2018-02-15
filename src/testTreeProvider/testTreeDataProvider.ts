import * as vscode from "vscode";
import { TestCase } from "../testTreeModel/testCase"
import { TestOutcome } from "../testTreeModel/testCaseResult"
import { TreeLabel } from "../testTreeModel/treeLabel"
import { GroupByProvider } from "./groupByProvider"
import { isExtensionEnabled, isAutoInitializeEnabled } from "../utils/vsconfig"
import { getImageResource } from "../utils/image"
import { MochaTestService } from "../mochaUnitTest/mochaTestService"

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
     * The current test cases
     */
    private testCases = Array<TestCase>();

    /**
     * The test service to discover and run tests
     */
    private testService: MochaTestService;

    /**
     * Group by filter provider that categorizes the test cases
     */
    private groupByFilter: GroupByProvider = new GroupByProvider();

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
            return Promise.resolve(item.getChildren() ? item.getChildren() : []);
        }
        else {
            // if testcase = null means that we are in the root
            return this.groupByFilter.getSelected().getCategories(this.testCases);
        }
    }

    /**
     * Render the test item
     * @param item The item that will be rendered 
     */
    public getTreeItem(item: TestTreeType): vscode.TreeItem {
        return <vscode.TreeItem>{
            label: item.getDisplayName(),
            collapsibleState: this.getItemCollapsibleState(item),
            command: {
                command: "vstest.explorer.open",
                arguments: [item],
                title: item.getDisplayName(),
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
            if (item.isRunning()) {
                return getImageResource("progress.svg");
            }

            let appendStringIcon = "";
            /*if (item.getResult() && item.getResult().sessionId != this.testService.getModel().getRunTestSessionId()) {
                appendStringIcon = "_previousExec";
            }*/
            const outcome = item.getTestResult() ? item.getTestResult().outcome : TestOutcome.None;
            switch (outcome) {
                case TestOutcome.Failed:
                    return getImageResource(`error${appendStringIcon}.svg`);
                case TestOutcome.None:
                    return getImageResource(`exclamation${appendStringIcon}.svg`);
                case TestOutcome.NotFound:
                    return getImageResource("interrogation.svg");
                case TestOutcome.Passed:
                    return getImageResource(`checked${appendStringIcon}.svg`);
                case TestOutcome.Skipped:
                    return getImageResource(`skipped${appendStringIcon}.svg`);
            }
        }
        return getImageResource("interrogation.svg");
    }


    /** 
     * Called when discovery test is needed
     */
    private discoveryTests() {
        this.testService.discoveryWorkspaceTests("C:\\Git\\p1-my-reads\\src").then((testCases) => {
            this.testCases = testCases;
            this._onDidChangeTreeData.fire();
        });
    }


    /**
     * Get tree item collapsible
     * @param item 
     */
    private getItemCollapsibleState(item: TestTreeType) {
        /*const treeItemAdditionalInfo: TestAdditionalData = this.testsAdditionalData.getValue(item.getId());
        if (treeItemAdditionalInfo) {
            return treeItemAdditionalInfo.collapsibleState;
        }
        const hasChildren: boolean = item.getChildren() ? item.getChildren().length > 0 : false;
        const collapsibleState: vscode.TreeItemCollapsibleState = hasChildren ? vscode.TreeItemCollapsibleState.Collapsed : null;
        return collapsibleState;*/

        return vscode.TreeItemCollapsibleState.Collapsed;
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

            const uri: string = item.getPath();
            vscode.workspace.openTextDocument(uri).then(result => {
                vscode.window.showTextDocument(result);
                const editor = vscode.window.activeTextEditor;

                //decrement 1 here because vscode is 0 base line index
                const range = editor.document.lineAt(item.getLine() - 1).range;
                editor.selection = new vscode.Selection(range.start, range.start);
                editor.revealRange(range);
            });
        }
    }

    /**
     * Register test explorer commands
     * @param context 
     */
    private registerCommands(context: vscode.ExtensionContext) {

        //register the go to test location command
        const goToTestLocationCommand = vscode.commands.registerCommand("vstest.explorer.open",
            (event) => this.onCommandGoToTestLocation(event));
        context.subscriptions.push(goToTestLocationCommand);

        //register the group by explorer command
        const groupByExplorerCommand = vscode.commands.registerCommand("vstest.explorer.groupBy",
            () => this.onCommandGroupBy());
        context.subscriptions.push(groupByExplorerCommand);


        /*const runCommand = vscode.commands.registerCommand("vstest.execution.runSelected",
            (item) => {
                if (item) {
                    this.runTests(item);
                }
                else {
                    this.runTests(this.selectedItem);
                }
            });
        context.subscriptions.push(runCommand);

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



        const refreshExplorerCommand = vscode.commands.registerCommand("vstest.explorer.refresh",
            () => this.discoveryTests());
        context.subscriptions.push(refreshExplorerCommand);

        const runAllTestCommand = vscode.commands.registerCommand("vstest.execution.runAll",
            () => this.runAllTests());
        context.subscriptions.push(runAllTestCommand);

        const showTestResult = vscode.commands.registerCommand("vstest.explorer.showResult", event => this.showTestResult(event));
        context.subscriptions.push(showTestResult);

        const initializeTestExplorer = vscode.commands.registerCommand("vstest.explorer.initialize", event => this.initialize());
        context.subscriptions.push(showTestResult);*/
    }

    /**
     * 
     */
    constructor(private context: vscode.ExtensionContext) {
        this.testService = new MochaTestService();

        this.registerCommands(context);

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





    private toggleItemCollapsibleState(test: TestTreeType) {
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