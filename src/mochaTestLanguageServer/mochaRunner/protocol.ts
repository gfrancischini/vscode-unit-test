import {NotificationType} from 'vscode-jsonrpc';

export enum TestSuiteUpdateType {
    Start,
    SuiteStart,
    SuiteEnd,
    HookFail,
    TestFail,
    TestPass,
    TestPending,
    TestStart,
    End
}

export interface TestSuite {
    path;
    title?;
    fullTitle?;
    duration?;
    err?;
}

export interface TestSuiteUpdateParams {
    type: TestSuiteUpdateType;
	testSuite : TestSuite;
}



export namespace TestSuiteUpdateNotification {
	export const type = new NotificationType<TestSuiteUpdateParams, void>('testSuiteUpdate');
}