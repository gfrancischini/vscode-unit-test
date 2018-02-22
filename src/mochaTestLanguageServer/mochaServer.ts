import { StreamMessageReader, StreamMessageWriter, SocketMessageWriter } from 'vscode-jsonrpc';
import {
    InitializeRequest, InitializeParams, InitializeResult, InitializeError,
    RunTestCasesParams, RunTestCasesResult,
    TestCaseUpdateNotification, TestCaseUpdateParams, DiscoveryTestCasesParams, DiscoveryTestCasesResult
} from "../testLanguage/protocol"
import { TestCase, TestCaseStatus } from "../testLanguage/protocol";
import * as path from "path";
import { escapeRegex } from "../utils/string"
import { TestLanguageServer } from "../testLanguage/server/testLanguageServer"
import { RunMochaProcess } from './mochaRunner'
import { MochaTestFinder } from "./mochaTestFinder"
import * as fs from "fs"
import * as net from "net";

class MochaTestLanguageServer extends TestLanguageServer {
    //TODO implement a way to join test cases everytime we run the on discovery
    protected testCases: Array<TestCase> = new Array<TestCase>();

    public registerListeners() {
        super.registerListeners();

        this.connection.onRunTestCases(async (params: RunTestCasesParams) => {
            await RunMochaProcess(params.sessionId, this.initializeParams.optsPath, params.testCases, this.testCases, this.getConnection(), params.debug).then(() => {
                return {
                    "test": "ok"
                }
            });
        });

        this.connection.onDiscoveryTestCases((params: DiscoveryTestCasesParams): DiscoveryTestCasesResult => {
            const discoveryTestCases = new Array<TestCase>();
            params.filePaths.forEach((path) => {
                discoveryTestCases.push(...MochaTestFinder.findTestCases(path));
                this.testCases.push(...discoveryTestCases);
            })

            findDuplicatesTestCases(discoveryTestCases);

            return {
                testCases: discoveryTestCases
            }
        });

    }
}

//writeble strem from fd 3
const pipe = fs.createWriteStream(null, {fd:3});

const mochaLanguageServer = new MochaTestLanguageServer();
mochaLanguageServer.listen(new StreamMessageReader(process.stdin),
    new SocketMessageWriter(<any>pipe));

/**
 * Override default console.log to redirect output from user test cases to the appropriate channel
 */
console.log = function (data: string) {
    mochaLanguageServer.getConnection().dataOutput({ data });
};

/**
 * Find all duplicate test cases and log the information
 * @param testCases
 */
function findDuplicatesTestCases(testCases: Array<TestCase>) {
    const fullTitles = testCases.map((testCase) => { return testCase.fullTitle });

    const count = fullTitles =>
        fullTitles.reduce((a, b) =>
            Object.assign(a, { [b]: (a[b] || 0) + 1 }), {})

    const duplicates = dict =>
        Object.keys(dict).filter((a) => dict[a] > 1)

    const foundDuplicates = duplicates(count(fullTitles));

    foundDuplicates.forEach((fullTitle) => {
        const filtered = testCases.filter((testCase) => {
            return testCase.fullTitle === fullTitle;
        })
        filtered.forEach((testCase) => {
            console.log(`Duplicated test ${testCase.fullTitle} - Source ${testCase.path}:${testCase.line}`);
        });
    });
    //console.log(count(names)) // { Mike: 1, Matt: 1, Nancy: 2, Adam: 1, Jenny: 1, Carl: 1 }
    //console.log() // [ 'Nancy' ]
}