import * as vscode from "vscode";
import { TestCase, TestCaseStatus } from "../testLanguage/protocol"
import { TreeLabel } from "./treeLabel"
import { GroupByProvider } from "./groupByProvider"
import { isExtensionEnabled, isAutoInitializeEnabled, getCurrentTestProviderName, getTestProviderSettings } from "../utils/vsconfig"
import { getImageResource } from "../utils/image"
import { TestProvider, TestLanguageStatus } from "../testProvider"
import * as Collections from "typescript-collections";
import { TestTreeType } from "./treeType"

export class TestTreeDataProvider implements vscode.TreeDataProvider<TestTreeType> {
    public _onDidChangeTreeData: vscode.EventEmitter<TestTreeType | null> = new vscode.EventEmitter<TestTreeType | null>();
    readonly onDidChangeTreeData: vscode.Event<TestTreeType | null> = this._onDidChangeTreeData.event;

    /**
     * Group by filter provider that categorizes the test cases
     */
    private groupByFilter: GroupByProvider = new GroupByProvider();


    /**
     * 
     * @param context 
     * @param codeTestLanguageClientProvider The test service to discover and run tests
     */
    constructor(private context: vscode.ExtensionContext, private testProvider: TestProvider) {
        this.registerServerCommands(context);

        this.testProvider.client.onDidTestCaseChanged((testCase : TestCase) => {
            this.refrehTestExplorer(null);
        })
    }


    /**
     * Get children method that must be implemented by test tree provider
     * @param item The test case to draw on the test tree
     */
    public getChildren(item?: TestTreeType): Thenable<TestTreeType[]> {
        switch (this.testProvider.status) {
            case TestLanguageStatus.None:
                return this.createNotInitializedLabel();
            case TestLanguageStatus.Initializing:
                return this.createInitializingLabel();
        }

        // if the testcase exists then resolve it children
        if (item) {
            if (item instanceof TreeLabel) {
                return Promise.resolve(item.children ? item.children : []);
            }
            const filtered = this.testProvider.client.testCaseCollection.testCasesDictionary.values().filter((testCase) => {
                return testCase.parentId === item.id;
            });
            return Promise.resolve(filtered);
        }
        else {
            // if testcase = null means that we are in the root
            return this.groupByFilter.getSelected().getCategories(this.testProvider.client.testCaseCollection.testCasesDictionary.values());
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
                command: "unit.test.explorer.openTestResult",
                arguments: [item],
                title: item.title,
            },
            iconPath: this.getIcon(item),
            id: item.id
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
            if (item.isRunning) {
                return getImageResource(`progress.svg`);
            }
            let appendStringIcon = "";
            if (item.sessionId != this.testProvider.client.sessionId) {
                appendStringIcon = "_previousExec";
            }
            const outcome = item.status;
            switch (outcome) {
                case TestCaseStatus.Failed:
                    return getImageResource(`error${appendStringIcon}.svg`);
                case TestCaseStatus.None:
                    return getImageResource(`exclamation.svg`);
                case TestCaseStatus.NotFound:
                    return getImageResource("interrogation.svg");
                case TestCaseStatus.Passed:
                    return getImageResource(`checked${appendStringIcon}.svg`);
                case TestCaseStatus.Skipped:
                    return getImageResource(`skipped${appendStringIcon}.svg`);
            }
        }
        return getImageResource("interrogation.svg");
    }





    /**
     * Get tree item collapsible
     * @param item 
     */
    private getItemCollapsibleState(item: TestTreeType) {
        if (item instanceof TreeLabel) {
            return vscode.TreeItemCollapsibleState.Expanded;
        }

        const hasChildren = item.hasChildren;

        return hasChildren ? vscode.TreeItemCollapsibleState.Collapsed : null;
    }

    /**
     * Create a no test found label
     */
    private createNoTestFoundLabel() {
        const label: TreeLabel = new TreeLabel("No Test Found", TestCaseStatus.None, null);
        return Promise.resolve([label]);
    }

    /**
     * Create a not initialized label
     */
    private createNotInitializedLabel() {
        const label: TreeLabel = new TreeLabel("Not Initialized", TestCaseStatus.None, null);
        return Promise.resolve([label]);
    }

    /**
     * Create a not initialized label
     */
    private createInitializingLabel() {
        const label: TreeLabel = new TreeLabel("Initializing", TestCaseStatus.None, null);
        return Promise.resolve([label]);
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
        this.testProvider.client.onDidTestCaseChanged((test: TestCase) => {
            this._onDidChangeTreeData.fire(test);
        });
    }

    private registerServerCommands(context: vscode.ExtensionContext) {


        //register the group by explorer command
        const groupByExplorerCommand = vscode.commands.registerCommand("unit.test.explorer.groupBy",
            () => this.onCommandGroupBy());
        context.subscriptions.push(groupByExplorerCommand);
    }

    /**
     * Refresh the test explorer node
     * @param test 
     */
    private refrehTestExplorer(test: TestCase) {
        this._onDidChangeTreeData.fire(test);
    }
}