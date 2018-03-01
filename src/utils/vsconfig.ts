import * as vscode from "vscode";

export function isExtensionEnabled(): boolean {
    const configuration  = vscode.workspace.getConfiguration(`unit.test`);
    const value = configuration.get("enable");
    return value == true || !value;
}

export function isAutoInitializeEnabled(): boolean {
    const configuration  = vscode.workspace.getConfiguration(`vstest`);
    const value = configuration.get("autoInitialize");
    //return value == true;
    return true;
}

export function getwatchInterval(): number {
    const configuration  = vscode.workspace.getConfiguration(`unit.test`);
    const value = configuration.get("watchInterval");
    return <number>value;
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


export function isCodeLensEnabled(): boolean {
    const configuration  = vscode.workspace.getConfiguration(`unit.test`);
    const value = configuration.get("enableCodeLens");
    return value == true;
}


export function readSettings(scope: vscode.Uri) {
    const currentProviderName = getCurrentTestProviderName(scope);

    const configurations = getTestProviderSettings(currentProviderName);

    return configurations;
}