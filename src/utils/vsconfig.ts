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

export function getMochaGlob(): string {
    const configuration  = vscode.workspace.getConfiguration(`mocha`);
    const value = configuration.get("glob");
    return <string>value;
}

export function getMochaOptsPath(): string {
    const configuration  = vscode.workspace.getConfiguration(`mocha`);
    const value = configuration.get("opts");
    return <string>value;
}