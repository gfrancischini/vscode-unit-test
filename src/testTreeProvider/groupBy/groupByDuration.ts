import { GroupBy } from './groupBy'
import { TestCase, TestCaseStatus } from '../../testLanguage/protocol';
import { TreeLabel } from '../../testTreeModel/treeLabel'
import { TestTreeType } from "../../testTreeModel/treeType"

export class GroupByDuration extends GroupBy {
    static TYPE: string = "GroupByDuration";

    constructor() {
        super(GroupByDuration.TYPE, "Duration", "Groups test by execution time: Fast, Medium, and Slow.");
    }

    /**
     * Return a array list of all slow tests
     */
    public getSlowTests(testCases: Array<TestCase>): Array<TestCase> {
        const tests = testCases.filter((test: TestCase) => {
            if (test.status != TestCaseStatus.None && test.getDurationInMilliseconds() > 1000) {
                return true;
            }
            return false;
        });
        return tests;
    }

    /**
     * Return a array list of all slow tests
     */
    public getMediumTests(testCases: Array<TestCase>): Array<TestCase> {
        const tests = testCases.filter((test: TestCase) => {
            if (test.status != TestCaseStatus.None && test.getDurationInMilliseconds() >= 100 && test.getDurationInMilliseconds() <= 1000) {
                return true;
            }
            return false;
        });
        return tests;
    }

    /**
     * Return a array list of all slow tests
     */
    public getFastTests(testCases: Array<TestCase>): Array<TestCase> {
        const tests = testCases.filter((test: TestCase) => {
            if (test.status != TestCaseStatus.None && test.getDurationInMilliseconds() < 100) {
                return true;
            }
            return false;
        });
        return tests;
    }

    /**
     * Return a promise of Array<TestTreeType> that has all the test classified by a certain logic.
     * Group the test by duration (Not Run, Fast, Medium, Slow)
     * @param testCases The available test cases
     */
    public getCategories(testCases: Array<TestCase>): Promise<Array<TestTreeType>> {
        return new Promise<Array<TestTreeType>>((resolve, reject) => {
            const outcomeArray = new Array<TreeLabel>();


            const slowTests: TreeLabel = new TreeLabel("Slow > 1sec", TestCaseStatus.None, this.getSlowTests(testCases));
            const mediumTestsLabel: TreeLabel = new TreeLabel("Medium >= 100ms", TestCaseStatus.None, this.getMediumTests(testCases));
            const fastTestsLabel: TreeLabel = new TreeLabel("Fast < 100ms", TestCaseStatus.None, this.getFastTests(testCases));
            const notRunTestsLabel: TreeLabel = new TreeLabel("Not Run Tests", TestCaseStatus.None, this.getNotRunTests(testCases));
            
            // only add filters if there is children to display
            if (slowTests.getChildrenLenght() > 0) {
                outcomeArray.push(slowTests);
            }
            if (mediumTestsLabel.getChildrenLenght() > 0) {
                outcomeArray.push(mediumTestsLabel);
            }
            if (fastTestsLabel.getChildrenLenght() > 0) {
                outcomeArray.push(fastTestsLabel);
            }
            if (notRunTestsLabel.getChildrenLenght() > 0) {
                outcomeArray.push(notRunTestsLabel);
            }
            
            resolve(outcomeArray);
        });
    }
}