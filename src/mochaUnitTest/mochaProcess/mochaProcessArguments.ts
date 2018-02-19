import { PathUtils } from "../../utils/path";

export class MochaProcessFile {
    filePath:string;
    grep:string;

    constructor(filePath,grep) {
        this.filePath = filePath;
        this.grep = grep;
    }
}

export class MochaProcessArguments {
    //rootPath: string;
    //workspacePath: string;
    files: Array<MochaProcessFile> = new Array<MochaProcessFile>();
    require: Array<String> = new Array<String>();
}

export class MochaProcessArgumentsCallback {
    type: string;
    object: any;

    constructor(type: string, object: any) {
        this.type = type;
        this.object = object;
    }
}

export class MochaProcessError {
    error : string;
    message : string;
    stack : string;

    constructor(error, message, stack) {
        this.error = error;
        this.message = message;
        this.stack = stack;
    }


}

export class MochaTestFrameworkDetail {
    qtyOfTests : number;
    qtyFailures : number;
    constructor(qtyOfTests : number, qtyFailures : number = 0) {
        this.qtyOfTests = qtyOfTests;
        this.qtyFailures = qtyFailures;
    }
}

export class MochaProcessTestCaseUpdate {
    name: string;
    fullName: string;
    suitePath: string;
    filePath: any;
    success: boolean;
    error: string;
    stack: string;
    state: string;
    duration : number;
    constructor(suitePath, title, filePath: any, state, duration, error?, stack?) {
        this.name = title;
        //this.fullName = /*trimArray(suitePath).concat([this.name]).join(" ")*/;
        this.fullName = this.name;
        if (suitePath.length > 0) {
            this.fullName = suitePath[suitePath.length - 1] + " " + this.name;
        }
        this.suitePath = suitePath.slice();
        this.filePath = PathUtils.normalizePath(filePath);
        this.error = error;
        this.stack = stack;
        this.state = state;
        this.duration = duration;
    }
}