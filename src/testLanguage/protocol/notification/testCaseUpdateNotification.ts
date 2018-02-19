import {NotificationType} from 'vscode-jsonrpc';
import {TestCase} from "../testCase"

export interface TestCaseUpdateParams {
	testCase : TestCase;
}

export namespace TestCaseUpdateNotification {
	export const type = new NotificationType<TestCaseUpdateParams, void>('testCaseUpdate');
}