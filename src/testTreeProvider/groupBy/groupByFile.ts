import { GroupBy } from './groupBy'
import { TestCase, TestCaseStatus } from '../../testLanguage/protocol';
import { TreeLabel } from '../../testTreeModel/treeLabel'
import { TestTreeType } from "../../testTreeModel/treeType"

export class GroupByFile extends GroupBy {
    static TYPE: string = "GroupByFile";

    constructor() {
        super(GroupByFile.TYPE, "File", "Groups tests by file results: Failed Tests, Skipped Tests, Passed Tests.");
    }

    /**
     * Return a promise of Array<TreeLabel> that has all the test classified by a certain logic.
     * Group the test by status (Not Run, Failed, Success)
     * @param testCases The available test cases
     */
    public getCategories(testCases: Array<TestCase>): Promise<Array<TestTreeType>> {
        return new Promise<Array<TestTreeType>>((resolve, reject) => {
            const filtered = testCases.filter((testCase) => {
                return testCase.parendId == null;
            })

            resolve(filtered);
        });
    }
}