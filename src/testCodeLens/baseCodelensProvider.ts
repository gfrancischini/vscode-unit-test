import vscode = require('vscode');

export abstract class BaseCodeLensProvider implements vscode.CodeLensProvider {
	protected enabled: boolean = true;
	public onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();


	public get onDidChangeCodeLenses(): vscode.Event<void> {
		return this.onDidChangeCodeLensesEmitter.event;
	}

	public setEnabled(enabled: boolean): void {
		if (this.enabled !== enabled) {
			this.enabled = enabled;
			this.onDidChangeCodeLensesEmitter.fire();
		}
	}

	provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
		return [];
	}

}