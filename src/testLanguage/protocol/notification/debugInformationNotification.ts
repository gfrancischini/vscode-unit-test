import {NotificationType} from 'vscode-jsonrpc';

export interface DebugInformationParams {
	data : any;
}

export namespace DebugInformationNotification {
	export const type = new NotificationType<DebugInformationParams, void>('debugInformation');
}