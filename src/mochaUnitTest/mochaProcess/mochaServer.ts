import { RequestHandler, createMessageConnection, StreamMessageReader, StreamMessageWriter, NotificationType } from 'vscode-jsonrpc';
import {
    InitializeRequest, InitializeParams, InitializeResult, InitializeError,
    RunTestCasesParams, RunTestCasesResult,
    TestCaseUpdateNotification, TestCaseUpdateParams
} from "../../testLanguage/protocol"
import { TestCase, TestCaseStatus } from "../../testLanguage/protocol";
import * as path from "path";
import { escapeRegex } from "../../utils/string"
import { TestLanguageServer } from "../../testLanguage/server/testLanguageServer"
import { RunMochaProcess } from './mochaRunner'

class MochaTestLanguageServer extends TestLanguageServer {
    public registerListeners() {
        super.registerListeners();

        this.connection.onRunTestCases(async (params: RunTestCasesParams) => {
            await RunMochaProcess(params.sessionId, params.testCases, this.getConnection()).then(() => {
                return {
                    "test" : "ok"
                }
            });
        });
    }
}


const mochaLanguageServer = new MochaTestLanguageServer();
mochaLanguageServer.listen(new StreamMessageReader(process.stdin),
    new StreamMessageWriter(process.stdout));

/**
 * Override default console.log to redirect output from user test cases to the appropriate channel
 */
console.log = function (str: string) {

};