import * as vscode from "vscode";
import { BaseCodeLensProvider } from "./baseCodelensProvider"
import { TestProvider } from "../testProvider"
import { PathUtils } from "../utils/path";
import { isCodeLensEnabled } from "../utils/vsconfig"

export class TestCodeLensProvider extends BaseCodeLensProvider {

    constructor(private context: vscode.ExtensionContext, private testProvider: TestProvider) {
        super();
        //

        this.testProvider.client.onDidTestCaseChanged((testCase) => {
            //we need to improve this
            this.onDidChangeCodeLensesEmitter.fire();
        });

        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("unit.test.enableCodeLens")) {
                this.setEnabled(isCodeLensEnabled());
            }
        })

    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        if (!this.enabled) {
            return [];
        }

        return this.getCodeLensForTests(document);
    }

    private getCodeLensForTests(document: vscode.TextDocument): Thenable<vscode.CodeLens[]> {
        return new Promise((resolve, reject) => {
            let codelens = [];

            const testCases = this.testProvider.client.testCaseCollection.testCasesDictionary.values();
            const filteredTestCases = testCases.filter((testCase) => {
                return testCase.path === PathUtils.normalizePath(document.uri.fsPath);
            })

            filteredTestCases.forEach((testCase) => {
                let runTestCmd: vscode.Command = {
                    title: 'run',
                    command: 'unit.test.execution.runSelected',
                    arguments: [testCase]
                };

                let debugTestCmd: vscode.Command = {
                    title: 'debug',
                    command: 'unit.test.execution.debugSelected',
                    arguments: [testCase]
                };


                codelens.push(new vscode.CodeLens(new vscode.Range(testCase.line, 0, testCase.line, 5), runTestCmd));
                codelens.push(new vscode.CodeLens(new vscode.Range(testCase.line, 5, testCase.line, 10), debugTestCmd));

            });

            resolve(codelens);
        });
    }
}