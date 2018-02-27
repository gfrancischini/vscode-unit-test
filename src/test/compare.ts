import * as chai from "chai"

import { TestCase, TestCaseStatus } from '../testLanguage/protocol'


export interface TestCaseCompare {
    code?: string;
    id?: string;
    path?: string;
    title?: string;
    line?: number;
    column?: number;
    fullTitle?: string;
    parentId?: string;
    isTestCase?: boolean;
    isRunning?: boolean;
    hasChildren?: boolean;
    errorMessage?: string;
    errorStackTrace?: string;
    status?: TestCaseStatus;
    startTime?: Date;
    endTime?: Date;
    sessionId?: number;
    duration?: number;
    [custom: string]: any;
}


export function equalsTestCase(actual: TestCase, expected: TestCaseCompare) {
    for (let key in expected) {
        const message: string = `Expected the property '${key}' to be equals to '${expected[key]}'. Found '${actual[key]}'`;
        chai.expect(actual[key], message).to.be.equals(expected[key]);
    }
}