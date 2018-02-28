import * as chai from "chai"

import { MochaTestFinder } from './mochaTestFinder'
import { getTestFilePath } from "../../test/utils"
import { TestCaseCompare, equalsTestCase } from "../../test/compare"
import { MochaTestCase } from './mochaTestCase'
import { TestCase, TestCaseStatus } from '../../testLanguage/protocol'

const getModuleFilePath = (name: string): string => { return getTestFilePath("mochaTestFinder", name) };

suite('findTestCases', () => {
    test('throw file not found exception when file does not exists', () => {
        chai.should().throw(() => { MochaTestFinder.findTestCases("wrong file path", new Array<TestCase>()) }, Error);
    });
    test('return empty Array when there is no test case ', () => {
        const filePath = getModuleFilePath("TestDeclaration_EmptyFile.js");
        const value = MochaTestFinder.findTestCases(filePath, new Array<TestCase>());
        chai.expect(value, "The array should be empty").to.be.empty;
    });
});

suite('findTestCases visit ', () => {
    test('should retrieve the correct test case name from multiple lines', () => {
        const filePath = getModuleFilePath("TestDeclaration_MultipleLineName.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath, new Array<TestCase>());

        equalsTestCase(value[1], {
            title: "This is a multiple line title that was correctly parsed"
        });
    });

    test('should retrieve the correct test case even if file has syntax errors', () => {
        const filePath = getModuleFilePath("TestDeclaration_InvalidSyntax.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath, new Array<TestCase>());
        equalsTestCase(value[1], {
            title: "singleIt"
        });
    });
});


suite('findTestCases visit BDD', () => {
    test('should find one it test case', () => {
        const filePath = getModuleFilePath("SingleDeclaration_BDD_it.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath, new Array<TestCase>());

        //every time we find a test the first position is the file and the second is the test
        chai.expect(value.length).to.be.equal(2);

        equalsTestCase(value[1], {
            type: "it",
            title: "singleIt",
            fullTitle: "singleIt",
            path: filePath,
            isTestCase: true,
            hasChildren: false,
            code: "singleIt" + filePath,
            line: 0,
        });
    });

    test('should find one describe test case', () => {
        const filePath = getModuleFilePath("SingleDeclaration_BDD_describe.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath, new Array<TestCase>());

        //every time we find a test the first position is the file and the second is the test
        chai.expect(value.length).to.be.equal(2);

        equalsTestCase(value[1], {
            type: "describe",
            title: "singleDescribe",
            fullTitle: "singleDescribe",
            path: filePath,
            isTestCase: false,
            hasChildren: false,
            code: "singleDescribe" + filePath,
            line: 0,
        });
    });

    test('should find one describe with one it child', () => {
        const filePath = getModuleFilePath("TestDeclaration_BDD_Scenario1.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath, new Array<TestCase>());

        //every time we find a test the first position is the file and the second is the test
        chai.expect(value.length).to.be.equal(3);

        equalsTestCase(value[2], {
            type: "describe",
            title: "describer",
            fullTitle: "describer",
            path: filePath,
            isTestCase: false,
            hasChildren: true,
            code: "describer" + filePath,
            line: 0,
        });

        equalsTestCase(value[1], {
            type: "it",
            title: "iter",
            fullTitle: "describer iter",
            path: filePath,
            isTestCase: true,
            hasChildren: false,
            code: "iter" + filePath,
            line: 1,
            parentId: value[2].id,
        });
    });

});



suite('findTestCases visit TDD', () => {
    test('should find one "test" test case', () => {
        const filePath = getModuleFilePath("SingleDeclaration_TDD_test.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath, new Array<TestCase>());

        //every time we find a test the first position is the file and the second is the test
        chai.expect(value.length).to.be.equal(2);

        equalsTestCase(value[1], {
            type: "test",
            title: "singleTest",
            fullTitle: "singleTest",
            path: filePath,
            isTestCase: true,
            hasChildren: false,
            code: "singleTest" + filePath,
            line: 0,
        });
    });

    test('should find one "suite" test case', () => {
        const filePath = getModuleFilePath("SingleDeclaration_TDD_suite.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath, new Array<TestCase>());

        //every time we find a test the first position is the file and the second is the test
        chai.expect(value.length).to.be.equal(2);

        equalsTestCase(value[1], {
            type: "suite",
            title: "singleSuite",
            fullTitle: "singleSuite",
            path: filePath,
            isTestCase: false,
            hasChildren: false,
            code: "singleSuite" + filePath,
            line: 0,
        });
    });

    test('should find one "suite" with one "test" child', () => {
        const filePath = getModuleFilePath("TestDeclaration_TDD_Scenario1.js");
        const value = <Array<MochaTestCase>>MochaTestFinder.findTestCases(filePath, new Array<TestCase>());

        //every time we find a test the first position is the file and the second is the test
        chai.expect(value.length).to.be.equal(3);

        equalsTestCase(value[2], {
            type: "suite",
            title: "suiter",
            fullTitle: "suiter",
            path: filePath,
            isTestCase: false,
            hasChildren: true,
            code: "suiter" + filePath,
            line: 0,
        });

        equalsTestCase(value[1], {
            type: "test",
            title: "tester",
            fullTitle: "suiter tester",
            path: filePath,
            isTestCase: true,
            hasChildren: false,
            code: "tester" + filePath,
            line: 1,
            parentId: value[2].id,
        });
    });
});


