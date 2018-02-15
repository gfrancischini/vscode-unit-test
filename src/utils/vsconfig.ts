import * as vscode from "vscode";

export function isExtensionEnabled(): boolean {
    const configuration  = vscode.workspace.getConfiguration(`vstest`);
    const value = configuration.get("enable");
    //return value == true || !value;
    return true;
}

export function isAutoInitializeEnabled(): boolean {
    const configuration  = vscode.workspace.getConfiguration(`vstest`);
    const value = configuration.get("autoInitialize");
    //return value == true;
    return true;
}