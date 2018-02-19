import { TreeLabel } from '../../testTreeModel/treeLabel'
import { TestCase } from '../../testTreeModel/testCase';
import { TestOutcome } from '../../testTreeModel/testCaseResult';
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
            if (test.isTestCase && test.result.status === TestOutcome.None) {
                return true;
            }
            return false;
        });
        return tests;
    }

    //this.items.push(new GroupByQuickPickItem(GroupByQuickPickItemType.Duration, "Duration", "Groups test by execution time: Fast, Medium, and Slow."));

    public abstract getCategories(testCases: Array<TestCase>): Promise<Array<TreeLabel>>;
}