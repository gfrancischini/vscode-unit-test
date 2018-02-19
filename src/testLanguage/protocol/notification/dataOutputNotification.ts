import {NotificationType} from 'vscode-jsonrpc';

export interface DataOutputParams {
	data : string;
}

export namespace DataOutputNotification {
	export const type = new NotificationType<DataOutputParams, void>('dataOutput');
}