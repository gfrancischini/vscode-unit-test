import {TestOutcome, TestCaseResult} from "./testCaseResult"
import { PathUtils } from "../utils/path";

export class TestCase {


    /**
     * The file path that this test belong.
     */
    public path: string;

    /**
     * The path of the compiled filed.
     */
    public outputPath : string;

    /**
     * The title (name) of the test.
     */
    public title: string;

    /**
     * The parent test or file
     */
    public parent: TestCase;

    /**
     * The children tests
     */
    //public children: Array<TestCase>;

    /**
     * Line where this test is found
     */
    public line: number;

    /**
     * Column where this test is found
     */
    public column: number;

    /**
     * Full title of this test
     */
    public fullTitle: string;


     /**
     * The test result
     */
    result: TestCaseResult;

    public parendId = null;

    public isTestCase : boolean = true;
    


    constructor() {
    
        this.result = new TestCaseResult();
    }


    calculateFullTitle() {
        if (this.parent) {
            var full: string = this.parent.fullTitle;
            if (full) {
                this.fullTitle =  full + " " + this.title;
            }
            else {
                this.fullTitle =  this.title;
            }
        }
        else {
            this.fullTitle =  this.title;
        }
    }







    public getId() : string {
        return `${this.title}${this.path}`;
    }








    /*public getTestResult() {
        return this.result;
    }*/

    /**
     * Any additional info need by extensions
     */
    protected additionalInfo : object;

 
    /*getPath(): string {
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

  
    

    getAdditionalInfo(): any {
        return this.additionalInfo;
    }*/

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

    //setChildren(children: Array<TestCase>): void {
    //    this.children = children;
    //}

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
    /*public getDisplayName(): string {
        if (this.result) {
            return `${this.title} - ${this.result.getDurationInMilliseconds()} ms`;
        }
        return this.title;
    }


    public isRunning() : boolean {
        return false;
    }*/
}

