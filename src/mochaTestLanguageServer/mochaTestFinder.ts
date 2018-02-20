import * as ts from "typescript";
import * as fs from "fs-extra";
import * as path from "path";
import { MochaTestCase, SuiteItem, DescribeItem, ItItem } from "./MochaTestCase";
import { TestCase } from "../testLanguage/protocol";
export class MochaTestFinder {
    
    /**
     * Find test cases in the given file
     * @param filePath File path to search for test cases
     * @return Array of found test cases
     */
    public static findTestCases(filePath: string): Array<TestCase> {
        const textTestFile: string = fs.readFileSync(filePath).toString();
        const sourceFile: ts.SourceFile = ts.createSourceFile(
            filePath, textTestFile, ts.ScriptTarget.Latest, false, ts.ScriptKind.Unknown);

        const testCase = new TestCase();
        testCase.setLine(0);

        testCase.setPath(sourceFile.fileName);
        testCase.setTitle(path.basename(sourceFile.fileName));
        testCase.fullTitle = "";
        testCase.isTestCase = false;
        testCase.id = `${testCase.title}${testCase.path}`

        let testCases = new Array<TestCase>();
        testCases.push(testCase);

        //return sourceFile.statements.map(statement => MochaTestFinder.visit(sourceFile, statement, null)).filter(o => o);
        sourceFile.statements.map(statement => MochaTestFinder.visit(sourceFile, statement, testCase, testCases));

        if (testCases.length === 1) {
            testCases = new Array<TestCase>();
        }

        return testCases;
    }

    /**
     * Visit source file nodes to find mocha tests
     */
    private static visit(sourceFile: ts.SourceFile, node: ts.Node, parent: TestCase, testCases : Array<TestCase>): any {
        switch (node.kind) {
            case ts.SyntaxKind.ExpressionStatement: {
                const obj: ts.ExpressionStatement = node as ts.ExpressionStatement;
                return MochaTestFinder.visit(sourceFile, obj.expression, parent, testCases);
            }

            case ts.SyntaxKind.CallExpression: {
                const obj: ts.CallExpression = node as ts.CallExpression;
                const name: string = MochaTestFinder.visit(sourceFile, obj.expression, null, testCases);
                switch (name) {
                    case "suite": {
                        const pos: number = sourceFile.text.lastIndexOf("suite", obj.arguments[0].pos);


                        let result: SuiteItem = new SuiteItem();

                        result.setLine(sourceFile.getLineAndCharacterOfPosition(pos).line);

                        result.setTitle(MochaTestFinder.visit(sourceFile, obj.arguments[0], null, testCases));
                        const parentTitle = parent != null ? parent.fullTitle : null;
                        result.fullTitle = parentTitle ? parentTitle + " " + result.title : result.title;
                        //result.setChildren(children);
                        result.parendId = parent != null && parent.getId();
                        result.setPath(sourceFile.fileName);

                        result.code = `${result.title}${result.path}`
                        let children: any = MochaTestFinder.visit(sourceFile, obj.arguments[1], result, testCases);
                        if (!Array.isArray(children)) {
                            children = [children];
                        }
                        result.isTestCase = false;


                        testCases.push(result);

                        return result;
                    }

                    case "describe.skip":
                    case "describe": {
                        const pos: number = sourceFile.text.lastIndexOf("describe", obj.arguments[0].pos);


                        let result: DescribeItem = new DescribeItem();
                        result.setLine(sourceFile.getLineAndCharacterOfPosition(pos).line);

                        result.setTitle(MochaTestFinder.visit(sourceFile, obj.arguments[0], null, testCases));
                        const parentTitle = parent != null ? parent.fullTitle : null;
                        result.fullTitle = parentTitle ? parentTitle + " " + result.title : result.title;
                        //result.setChildren(children);
                        result.parendId = parent != null && parent.getId();
                        result.setPath(sourceFile.fileName);
                        result.code = `${result.title}${result.path}`
                        result.isTestCase = false;
                        let children: any = MochaTestFinder.visit(sourceFile, obj.arguments[1], result, testCases);
                        if (!Array.isArray(children)) {
                            children = [children];
                        }

                        testCases.push(result);

                        return result;
                    }

                    case "it.skip":
                    case "it": {
                        const pos: number = sourceFile.text.lastIndexOf("it", obj.arguments[0].pos);

                        let result: ItItem = new ItItem();
                        result.setLine(sourceFile.getLineAndCharacterOfPosition(pos).line);

                        result.setTitle(MochaTestFinder.visit(sourceFile, obj.arguments[0], null, testCases));
                        const parentTitle = parent != null ? parent.fullTitle : null;
                        result.fullTitle = parentTitle ? parentTitle + " " + result.title : result.title;
                        result.setPath(sourceFile.fileName);
                        result.parendId = parent != null && parent.getId();
                        result.code = `${result.title}${result.path}`

                        testCases.push(result);

                        return result;
                    }
                }

                return null;
            }

            case ts.SyntaxKind.ArrowFunction: {
                const obj: ts.ArrowFunction = node as ts.ArrowFunction;
                return MochaTestFinder.visit(sourceFile, obj.body, parent, testCases);
            }

            case ts.SyntaxKind.Identifier: {
                const obj: ts.Identifier = node as ts.Identifier;
                return obj.text;
            }

            case ts.SyntaxKind.StringLiteral: {
                const obj: ts.StringLiteral = node as ts.StringLiteral;
                return obj.text;
            }

            case ts.SyntaxKind.FunctionExpression: {
                const obj: ts.FunctionExpression = node as ts.FunctionExpression;
                if (obj.parameters.length === 0) {
                    return MochaTestFinder.visit(sourceFile, obj.body, parent, testCases);
                }

                break;
            }

            case ts.SyntaxKind.Block: {
                const obj: ts.Block = node as ts.Block;
                return obj.statements.map(statement => MochaTestFinder.visit(sourceFile, statement, parent, testCases)).filter(o => o);
            }

            case ts.SyntaxKind.ImportDeclaration:
            case ts.SyntaxKind.VariableStatement:
                return null;
            case ts.SyntaxKind.PropertyAccessExpression: {
                const obj: ts.PropertyAccessExpression = node as ts.PropertyAccessExpression;
                return MochaTestFinder.visit(sourceFile, obj.expression, parent, testCases) + "."
                    + MochaTestFinder.visit(sourceFile, obj.name, parent, testCases);
            }
            case ts.SyntaxKind.FunctionDeclaration: {
                const obj: ts.FunctionDeclaration = node as ts.FunctionDeclaration;
                return null;
            }
            case ts.SyntaxKind.BinaryExpression: {
                const obj: ts.BinaryExpression = node as ts.BinaryExpression;
                const textLeft = <string>MochaTestFinder.visit(sourceFile, obj.left, parent, testCases)
                const textRight = <string>MochaTestFinder.visit(sourceFile, obj.right, parent, testCases);
                return textLeft + textRight
            }
            default: {
                //console.log(`Unresolved node: ${ts.SyntaxKind[node.kind]} - File ${sourceFile.fileName}`);
                return null;
            }
        }
    }
}