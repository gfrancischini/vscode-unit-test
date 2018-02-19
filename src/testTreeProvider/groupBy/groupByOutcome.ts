import { GroupBy } from './groupBy'
import { TestCase, TestCaseStatus } from '../../testTreeModel/testCase';
import { TreeLabel } from '../../testTreeModel/treeLabel'


export class GroupByOutcome extends GroupBy {
    static TYPE: string = "GroupByOutcome";

    constructor() {
        super(GroupByOutcome.TYPE, "Outcome", "Groups tests by execution results: Failed Tests, Skipped Tests, Passed Tests.");
    }


    /**
     * Return a array list of all failed tests
     */
    public getFailedTests(testCases: Array<TestCase>): Array<TestCase> {
        const tests = testCases.filter((test: TestCase) => {
            if (test.isTestCase && test.status === TestCaseStatus.Failed) {
                return true;
            }
            return false
        });
        return tests;
    }

    /**
    * Return a array list of all passed tests
    */
    public getPassedTests(testCases: Array<TestCase>): Array<TestCase> {
        const tests = testCases.filter((test: TestCase) => {
            if (test.isTestCase && test.status === TestCaseStatus.Passed) {
                return true;
            }
            return false
        });
        return tests;
    }


    public getCategories(testCases: Array<TestCase>) {
        return new Promise<Array<TreeLabel>>((resolve, reject) => {
            const outcomeArray = new Array<TreeLabel>();

            //const testModel: TestModel = this.testService.getModel();

            const failedTestsLabel: TreeLabel = new TreeLabel("Failed Tests", TestCaseStatus.Failed, this.getFailedTests(testCases));
            const passedTests: TreeLabel = new TreeLabel("Passed Tests", TestCaseStatus.Passed, this.getPassedTests(testCases));
            const notRunTestsLabel: TreeLabel = new TreeLabel("Not Run Tests", TestCaseStatus.None, this.getNotRunTests(testCases));
            
            //this.testsAdditionalData.setValue(notRunTestsLabel.getId(), { collapsibleState: vscode.TreeItemCollapsibleState.Expanded });
            //this.testsAdditionalData.setValue(failedTestsLabel.getId(), { collapsibleState: vscode.TreeItemCollapsibleState.Expanded });
            //this.testsAdditionalData.setValue(passedTests.getId(), { collapsibleState: vscode.TreeItemCollapsibleState.Expanded });

            // only add filters if there is children to display
            if (failedTestsLabel.getChildrenLenght() > 0) {
                outcomeArray.push(failedTestsLabel);
            }
            if (passedTests.getChildrenLenght() > 0) {
                outcomeArray.push(passedTests);
            }
            if (notRunTestsLabel.getChildrenLenght() > 0) {
                outcomeArray.push(notRunTestsLabel);
            }
            

            resolve(outcomeArray);

        });
    }
}