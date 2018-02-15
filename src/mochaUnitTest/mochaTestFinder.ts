import * as ts from "typescript";
import * as fs from "fs-extra";

import { MochaTestCase, SuiteItem, DescribeItem, ItItem } from "./MochaTestCase";
import { TestCase } from "../testTreeModel/testCase";

export class MochaTestFinder {

    /**
     * Find test cases in the given file
     * @param filePath File path to search for test cases
     * @return Array of found test cases
     */
    public static findTestCases(filePath: string): TestCase[] {
        const textTestFile: string = fs.readFileSync(filePath).toString();
        const sourceFile: ts.SourceFile = ts.createSourceFile(
            filePath, textTestFile, ts.ScriptTarget.Latest, false, ts.ScriptKind.Unknown);
        return sourceFile.statements.map(statement => MochaTestFinder.visit(sourceFile, statement, null)).filter(o => o);
    }

    /**
     * Visit source file nodes to find mocha tests
     */
    private static visit(sourceFile: ts.SourceFile, node: ts.Node, parent: MochaTestCase): any {
        switch (node.kind) {
            case ts.SyntaxKind.ExpressionStatement: {
                const obj: ts.ExpressionStatement = node as ts.ExpressionStatement;
                return MochaTestFinder.visit(sourceFile, obj.expression, parent);
            }

            case ts.SyntaxKind.CallExpression: {
                const obj: ts.CallExpression = node as ts.CallExpression;
                const name: string = MochaTestFinder.visit(sourceFile, obj.expression, null);
                switch (name) {
                    case "suite": {
                        let result: SuiteItem = new SuiteItem();

                        let children: any = MochaTestFinder.visit(sourceFile, obj.arguments[1], result);
                        if (!Array.isArray(children)) {
                            children = [children];
                        }

                        const pos: number = sourceFile.text.lastIndexOf("suite", obj.arguments[0].pos);

                        result.setLine(sourceFile.getLineAndCharacterOfPosition(pos).line);
                        result.setTitle(MochaTestFinder.visit(sourceFile, obj.arguments[0], null));
                        result.setChildren(children);
                        result.setPath(sourceFile.fileName);
                        result.setParent(parent);
                        return result;
                    }

                    case "describe.skip": 
                    case "describe": {
                        let result: DescribeItem = new DescribeItem();
                        let children: any = MochaTestFinder.visit(sourceFile, obj.arguments[1], result);
                        if (!Array.isArray(children)) {
                            children = [children];
                        }

                        const pos: number = sourceFile.text.lastIndexOf("describe", obj.arguments[0].pos);

                        result.setLine(sourceFile.getLineAndCharacterOfPosition(pos).line);
                        result.setTitle(MochaTestFinder.visit(sourceFile, obj.arguments[0], null));
                        result.setChildren(children);
                        result.setPath(sourceFile.fileName);
                        result.setParent(parent);
                        return result;
                    }

                    case "it.skip":
                    case "it": {
                        let result: ItItem = new ItItem();
                        const pos: number = sourceFile.text.lastIndexOf("it", obj.arguments[0].pos);
                        result.setLine(sourceFile.getLineAndCharacterOfPosition(pos).line);
                        result.setTitle(MochaTestFinder.visit(sourceFile, obj.arguments[0], null));
                        result.setPath(sourceFile.fileName);
                        result.setParent(parent);
                        return result;
                    }
                }

                return null;
            }

            case ts.SyntaxKind.ArrowFunction: {
                const obj: ts.ArrowFunction = node as ts.ArrowFunction;
                return MochaTestFinder.visit(sourceFile, obj.body, parent);
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
                    return MochaTestFinder.visit(sourceFile, obj.body, parent);
                }

                break;
            }

            case ts.SyntaxKind.Block: {
                const obj: ts.Block = node as ts.Block;
                return obj.statements.map(statement => MochaTestFinder.visit(sourceFile, statement, parent)).filter(o => o);
            }

            case ts.SyntaxKind.ImportDeclaration:
            case ts.SyntaxKind.VariableStatement:
                return null;
            case ts.SyntaxKind.PropertyAccessExpression: {
                const obj: ts.PropertyAccessExpression = node as ts.PropertyAccessExpression;
                return MochaTestFinder.visit(sourceFile, obj.expression, parent) + "."
                    + MochaTestFinder.visit(sourceFile, obj.name, parent);
            }
            case ts.SyntaxKind.FunctionDeclaration: {
                const obj: ts.FunctionDeclaration = node as ts.FunctionDeclaration;
                return null;
            }
            default: {
                console.log("Unresolved node: \'" + ts.SyntaxKind[node.kind] + "\'");
                return null;
            }
        }
    }
}