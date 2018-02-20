'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { RegisterVSTestTreeProvider } from "./testTreeProvider/testTreeDataProvider";
import { isExtensionEnabled } from "./utils/vsconfig"
import {getOptions} from "./mochaTestLanguageServer/mochaOptionsReader"
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    if (isExtensionEnabled()) {
        RegisterVSTestTreeProvider(context);
    }  
    const opts = getOptions("C:\\Git\\p1-my-reads\\mocha.opts");
}

// this method is called when your extension is deactivated
export function deactivate() {
}