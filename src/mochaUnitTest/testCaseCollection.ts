
import * as Collections from "typescript-collections";

import { TestCase } from '../testTreeModel/testCase';

export class TestCaseCollection {

    public testCasesDictionary: Collections.Dictionary<string, TestCase> = new Collections.Dictionary<string, TestCase>();

    private findTestCaseByUniqueKey(testCasesDictionary: Collections.Dictionary<string, TestCase>,
        fileName: string, testUniqueKey: string) {
        if (fileName == null) {
            return null;
        }
        const key: string = fileName + " " + testUniqueKey;
        if (testCasesDictionary.containsKey(key)) {
            return testCasesDictionary.getValue(key);
        }

        return null;
    }

    public generateTestDictionary(testCasesMissing: Array<TestCase>) {
        if (testCasesMissing == null) {
            return;
        }

        this.testCasesDictionary = new Collections.Dictionary<string, TestCase>();

        testCasesMissing.forEach(test => {
            while (test.parent != null) {
                test = test.parent;
            }
            this.push(test);
        });
    }

    public push(testCase: TestCase) {
        this.testCasesDictionary.setValue(testCase.getId(), testCase);
        /*if (testCase.children == null) {
            return;
        }
        testCase.children.forEach((test: TestCase) => {
            this.testCasesDictionary.setValue(testCase.getId(), test);
            this.push(test);
        });*/
    }

    /*public updateTestCase(newTestCase: TestCase) {
        this.testCases.filter((testCase) => {
            !(testCase.title === newTestCase.title && testCase.path === newTestCase.path);
        });
        this.testCases.push(newTestCase);
    }*/
}