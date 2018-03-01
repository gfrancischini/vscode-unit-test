
import * as Collections from "typescript-collections";
import * as vscode from "vscode"
import * as throttle from "throttle-debounce/throttle";
import { TestCase } from './testLanguage/protocol/testCase';

export class TestCaseCollection {

    public testCasesDictionary: Collections.Dictionary<string, TestCase> = new Collections.Dictionary<string, TestCase>();

    protected testChanges = new Array<TestCase>();
    /**
     * vent notification emitted when test case change (new test, update)
     */
    protected _onDidTestCaseCollectionChanged: vscode.EventEmitter<Array<TestCase>>;

    constructor() {
        this._onDidTestCaseCollectionChanged = new vscode.EventEmitter<Array<TestCase>>();

    }

    private throttled = throttle(300, () => {
        // Throttled function 
        this._onDidTestCaseCollectionChanged.fire(this.testChanges);

        this.testChanges = new Array<TestCase>();
    });

    /**
     * Register a new listeener for the test changed
     */
    public get onDidTestCaseCollectionChanged(): vscode.Event<Array<TestCase>> {
        return this._onDidTestCaseCollectionChanged.event;
    }
    public push(testCase: TestCase) {
        this.testCasesDictionary.setValue(testCase.id, testCase);
        this.testChanges.push(testCase);

        this.throttled();
        
    }

    findAllChildrens(parentId: string): Array<TestCase> {
        const testCases: Array<TestCase> = new Array<TestCase>();

        const filtered = this.testCasesDictionary.values().filter((testCase) => {
            return testCase.parentId === parentId;
        })

        testCases.push(...filtered);

        filtered.forEach((testCase) => {
            testCases.push(...this.findAllChildrens(testCase.id));
        })

        return testCases;
    }
}