import {NotificationType} from 'vscode-jsonrpc';

export interface CancelParams {
	requestType : string;
}

export namespace CancelNotification {
	export const type = new NotificationType<CancelParams, void>('cancel');
}