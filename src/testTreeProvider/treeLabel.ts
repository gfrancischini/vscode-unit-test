import { TestCase, TestCaseStatus } from '../testLanguage/protocol';
import * as uuid from "uuid/v1"
/**
 * A class to handle the group lables of the tests
 */
export class TreeLabel {
    public children: Array<TestCase>;

    public title: string;

    private outcome: TestCaseStatus;

    public id: string;

    constructor(displayName: string, outcome: TestCaseStatus, tests: Array<TestCase> = null) {
        this.title = displayName;
        this.children = tests;
        this.outcome = outcome;
        this.id = uuid();//displayName + outcome.toString();
    }
}