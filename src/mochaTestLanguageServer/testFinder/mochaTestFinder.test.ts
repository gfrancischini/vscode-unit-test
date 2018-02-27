import * as chai from "chai"

import { MochaTestFinder } from './mochaTestFinder'
import { getTestFilePath } from "../../test/utils"
import { MochaTestCase } from './mochaTestCase'
import { TestCase, TestCaseStatus } from '../../testLanguage/protocol'

const getModuleFilePath = (name: string): string => { return getTestFilePath("mochaTestFinder", name) };

suite('findTestCases', () => {
    test('throw file not found exception when file does not exists', () => {
        chai.should().throw(() => { MochaTestFinder.findTestCases("wrong file path") }, Error);
    });
    test('return empty Array when there is no test case ', () => {
        const filePath = getModuleFilePath("TestDeclaration_EmptyFile.js");
        const value = MochaTestFinder.findTestCases(filePath);
        chai.expect(value, "The array should be empty").to.be.empty;
    });
});

suite('findTestCases visit ', () => {
    test('should retrieve the correct test case name from multiple lines', () => {
        const filePath = getModuleFilePath("TestDeclaration_MultipleLineName.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath);

        equalsTestCase({
            title: "This is a multiple line title that was correctly parsed"
        }, value[1]);
    });

    test('should retrieve the correct test case even if file has syntax errors', () => {
        const filePath = getModuleFilePath("TestDeclaration_InvalidSyntax.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath);
        equalsTestCase({
            title: "singleIt"
        }, value[1]);
    });
});


suite('findTestCases visit BDD', () => {
    test('should find one it test case', () => {
        const filePath = getModuleFilePath("SingleDeclaration_BDD_it.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath);

        //every time we find a test the first position is the file and the second is the test
        chai.expect(value.length).to.be.equal(2);

        equalsTestCase({
            type: "it",
            title: "singleIt",
            fullTitle: "singleIt",
            path: filePath,
            isTestCase: true,
            hasChildren: false,
            code: "singleIt" + filePath,
            line: 0,
        }, value[1]);
    });

    test('should find one describe test case', () => {
        const filePath = getModuleFilePath("SingleDeclaration_BDD_describe.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath);

        //every time we find a test the first position is the file and the second is the test
        chai.expect(value.length).to.be.equal(2);

        equalsTestCase({
            type: "describe",
            title: "singleDescribe",
            fullTitle: "singleDescribe",
            path: filePath,
            isTestCase: false,
            hasChildren: false,
            code: "singleDescribe" + filePath,
            line: 0,
        }, value[1]);
    });

    test('should find one describe with one it child', () => {
        const filePath = getModuleFilePath("TestDeclaration_BDD_Scenario1.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath);

        //every time we find a test the first position is the file and the second is the test
        chai.expect(value.length).to.be.equal(3);

        equalsTestCase({
            type: "describe",
            title: "describer",
            fullTitle: "describer",
            path: filePath,
            isTestCase: false,
            hasChildren: true,
            code: "describer" + filePath,
            line: 0,
        }, value[2]);

        equalsTestCase({
            type: "it",
            title: "iter",
            fullTitle: "describer iter",
            path: filePath,
            isTestCase: true,
            hasChildren: false,
            code: "iter" + filePath,
            line: 1,
            parentId: value[2].id,
        }, value[1]);
    });

});



suite('findTestCases visit TDD', () => {
    test('should find one "test" test case', () => {
        const filePath = getModuleFilePath("SingleDeclaration_TDD_test.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath);

        //every time we find a test the first position is the file and the second is the test
        chai.expect(value.length).to.be.equal(2);

        equalsTestCase({
            type: "test",
            title: "singleTest",
            fullTitle: "singleTest",
            path: filePath,
            isTestCase: true,
            hasChildren: false,
            code: "singleTest" + filePath,
            line: 0,
        }, value[1]);
    });

    test('should find one "suite" test case', () => {
        const filePath = getModuleFilePath("SingleDeclaration_TDD_suite.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath);

        //every time we find a test the first position is the file and the second is the test
        chai.expect(value.length).to.be.equal(2);

        equalsTestCase({
            type: "suite",
            title: "singleSuite",
            fullTitle: "singleSuite",
            path: filePath,
            isTestCase: false,
            hasChildren: false,
            code: "singleSuite" + filePath,
            line: 0,
        }, value[1]);
    });

    test('should find one "suite" with one "test" child', () => {
        const filePath = getModuleFilePath("TestDeclaration_TDD_Scenario1.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath);

        //every time we find a test the first position is the file and the second is the test
        chai.expect(value.length).to.be.equal(3);

        equalsTestCase({
            type: "suite",
            title: "suiter",
            fullTitle: "suiter",
            path: filePath,
            isTestCase: false,
            hasChildren: true,
            code: "suiter" + filePath,
            line: 0,
        }, value[2]);

        equalsTestCase({
            type: "test",
            title: "tester",
            fullTitle: "suiter tester",
            path: filePath,
            isTestCase: true,
            hasChildren: false,
            code: "tester" + filePath,
            line: 1,
            parentId: value[2].id,
        }, value[1]);
    });
});




interface TestCaseCompare {
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


function equalsTestCase(actual: TestCaseCompare, expected: MochaTestCase, ) {
    for (let key in actual) {
        const message: string = `Expected the property '${key}' to be equals to '${expected[key]}'. Found '${actual[key]}'`;
        chai.expect(actual[key], message).to.be.equals(expected[key]);
    }
}