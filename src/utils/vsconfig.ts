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

export function getTestProviderSettings(testProviderName : string): vscode.WorkspaceConfiguration {
    const configuration  = vscode.workspace.getConfiguration(`unit.test.${testProviderName}`);
    return configuration;
}

export function getCurrentTestProviderName(scope : vscode.Uri) {
    const configuration  = vscode.workspace.getConfiguration(`unit.test`, scope);
    const value = configuration.get("provider");
    return <string>value;
}