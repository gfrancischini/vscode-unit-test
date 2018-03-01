'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TestTreeDataProvider } from "./testTreeProvider/testTreeDataProvider";
import { TestCodeLensProvider } from "./testCodeLens/testCodeLensProvider";
import { isExtensionEnabled } from "./utils/vsconfig"
import { TestProvider } from "./testProvider"
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    
    if (isExtensionEnabled()) {
        const testProvider : TestProvider = new TestProvider(context);
        testProvider.initialize().then((initalizeResult) => {
            console.log("initalizeResult: " + JSON.stringify(initalizeResult));          

            const testTreeDataProvider: TestTreeDataProvider = new TestTreeDataProvider(context, testProvider);
            vscode.window.registerTreeDataProvider("unit.test.explorer.vsTestTree", testTreeDataProvider);

            const JS_MODE: vscode.DocumentFilter = { language: 'typescript', scheme: 'file' };
            const testCodeLensProvider: TestCodeLensProvider = new TestCodeLensProvider(context, testProvider);
            context.subscriptions.push(vscode.languages.registerCodeLensProvider(JS_MODE, testCodeLensProvider));
           
            testProvider.discoveryTests();
        }).catch((reason) => {
            vscode.window.showErrorMessage(`Error initializing: ${reason}`);
            if(reason instanceof Error) {
                console.log(`Error initializing: ${reason.message} : ${reason.stack}`);
            }
        })
    }  
}




// this method is called when your extension is deactivated
export function deactivate() {
}