import * as vscode from "vscode";
import { getAllTestFilesInDirectory } from '../utils/directory'
import { MochaTestFinder } from './mochaTestFinder'
import { TestCase } from '../testTreeModel/testCase'
import Event, { Emitter } from "../base/common/Event";

/** 
 * Class responsible for handling the test communication events 
 */
export class MochaTestService {
    private globPattern = "*.test.js";

    /**
    * Discover the files in the given directory
    * @param directory The directory path do discvery the tests
    */
    public discoveryWorkspaceTests(directory: string): Promise<Array<TestCase>> {
        return <Promise<Array<TestCase>>>vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: "Test Adapter" }, progress => {
            progress.report({ message: "Discovering Tests" });
            return new Promise((resolve, reject) => {
                const testFilesPath = getAllTestFilesInDirectory(directory, this.globPattern);

                const testCases = new Array<TestCase>();

                testFilesPath.forEach(testFilePath => {
                    const results = MochaTestFinder.findTestCases(testFilePath);
                    results.forEach((result) => {
                        testCases.push(result);
                    });
                });

                return resolve(testCases);
            });
        });     
    }

    /**
     * Run a set of tests 
     * @param tests The set of test to run
     * @param debuggingEnabled 
     */
    //public runTests(tests: Array<Test>, debuggingEnabled: boolean = false) {

    //}


    /**
     * Event notification emitted when test case change (new test, update)
     */
    private _onDidTestCaseChanged: Emitter<TestCase>;

    /**
     * Register a new listeener for the test changed
     */
    public get onDidTestCaseChanged(): Event<TestCase> {
        return this._onDidTestCaseChanged.event;
    }

}