import {TestOutcome, TestCaseResult} from "./testCaseResult"
import { PathUtils } from "../utils/path";

export class TestCase {


    /**
     * The file path that this test belong.
     */
    protected path: string;

    /**
     * The path of the compiled filed.
     */
    protected outputPath : string;

    /**
     * The title (name) of the test.
     */
    protected title: string;

    /**
     * The parent test or file
     */
    protected parent: TestCase;

    /**
     * The children tests
     */
    protected children: Array<TestCase>;

    /**
     * Line where this test is found
     */
    protected line: number;

    /**
     * Column where this test is found
     */
    protected column: number;

    /**
     * Full title of this test
     */
    protected fullTitle: string;


     /**
     * The test result
     */
    result: TestCaseResult;


    public getTestResult() {
        return this.result;
    }

    /**
     * Any additional info need by extensions
     */
    protected additionalInfo : object;

 
    getPath(): string {
        return this.path;
    }

    getOutputPath(): string {
        if(this.outputPath == null) {
            this.outputPath = this.parent.getOutputPath();
        }
        return this.outputPath;
    }

    getTitle(): string {
        return this.title;
    }

    getParent(): TestCase {
        return this.parent;
    }

    getChildren(): Array<TestCase> {
        return this.children;
    }

    getLine(): number {
        return this.line;
    }
    getColumn(): number {
        return this.column;
    }

  
    getFullTitle(): string {
        if (this.parent) {
            var full: string = this.parent.getFullTitle();
            if (full) {
                return full + " " + this.title;
            }
        }
        return this.title;
    }

    getAdditionalInfo(): any {
        return this.additionalInfo;
    }

    setPath(path: string): void {
        this.path = PathUtils.normalizePath(path);
    }

    setOutputPath(outputPath: string): void {
        this.outputPath = PathUtils.normalizePath(outputPath);
    }

    setTitle(title: string): void {
        this.title = title;
    }

    setParent(parent: TestCase): void {
        this.parent = parent;
    }

    setChildren(children: Array<TestCase>): void {
        this.children = children;
    }

    setLine(line: number): void {
        this.line = line;
    }

    setColumn(column: number): void {
        this.column = column;
    }

    

    setAdditionalInfo(additionalInfo: any): void {
        this.additionalInfo = additionalInfo;
    }

     /**
     * Return the test display name
     */
    public getDisplayName(): string {
        if (this.result) {
            return `${this.title} - ${this.result.getDurationInMilliseconds()} ms`;
        }
        return this.title;
    }


    public isRunning() : boolean {
        return false;
    }
}

