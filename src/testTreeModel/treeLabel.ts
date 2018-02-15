import {TestCase} from "./testCase"
import {TestOutcome} from "./testCaseResult"

/**
 * A class to handle the group lables of the tests
 */
export class TreeLabel {
    private tests: Array<TestCase>;

    private displayName: string;

    private outcome: TestOutcome;



    constructor(displayName: string, outcome: TestOutcome, tests: Array<TestCase> = null) {
        this.displayName = displayName;
        this.tests = tests;
        this.outcome = outcome;
    }

    public getChildrenLenght(): number {
        return this.getChildren() ? this.getChildren().length : 0;
    }

    public getDisplayName() {
        return `${this.displayName} (${this.getChildrenLenght()})`;
    }

    public setTests(tests: Array<TestCase>) {
        this.tests = tests;
    }

    public getChildren(): Array<TestCase> {
        return this.tests;
    }

    public getOutcome(): TestOutcome {
        return this.outcome;
    }

    public getId(): string {
        return this.displayName;
    }
}