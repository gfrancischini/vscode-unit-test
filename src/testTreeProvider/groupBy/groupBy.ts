import { TreeLabel } from '../../testTreeModel/treeLabel'
import { TestCase, TestCaseStatus } from '../../testTreeModel/testCase';
import * as vscode from "vscode";

export abstract class GroupBy implements vscode.QuickPickItem{
    public type: string;
    public label: string;
    public description: string;

    constructor(type, label, description) {
        this.type = type;
        this.label = label;
        this.description = description;
    }

    /**
    * Return a array list of all not run tests
    */
    public getNotRunTests(testCases: Array<TestCase>): Array<TestCase> {
        const tests = testCases.filter((test: TestCase) => {
            if (test.isTestCase && test.status === TestCaseStatus.None) {
                return true;
            }
            return false;
        });
        return tests;
    }

    //this.items.push(new GroupByQuickPickItem(GroupByQuickPickItemType.Duration, "Duration", "Groups test by execution time: Fast, Medium, and Slow."));

    public abstract getCategories(testCases: Array<TestCase>): Promise<Array<TreeLabel>>;
}