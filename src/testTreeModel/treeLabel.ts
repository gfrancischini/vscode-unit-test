import {TestCase} from "./testCase"
import {TestOutcome} from "./testCaseResult"

/**
 * A class to handle the group lables of the tests
 */
export class TreeLabel {
    public children: Array<TestCase>;

    public title: string;

    private outcome: TestOutcome;



    constructor(displayName: string, outcome: TestOutcome, tests: Array<TestCase> = null) {
        this.title = displayName;
        this.children = tests;
        this.outcome = outcome;
    }

    public getChildrenLenght(): number {
        return this.getChildren() ? this.getChildren().length : 0;
    }

    public getDisplayName() {
        return `${this.title} (${this.getChildrenLenght()})`;
    }

    public setTests(tests: Array<TestCase>) {
        this.children = tests;
    }

    public getChildren(): Array<TestCase> {
        return this.children;
    }

    public getOutcome(): TestOutcome {
        return this.outcome;
    }

    public getId(): string {
        return this.title;
    }
}