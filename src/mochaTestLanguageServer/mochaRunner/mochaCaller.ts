import * as path from "path"
import * as cp from "child_process";

export function startMochaRunnerServer(cwd: string, mochaPath : string, port : number,mochaArgs : any, isDebug = true) : cp.ChildProcess {
    const forkArgs: Array<any> = [];
    const spawnArgs = [];

    //uncoment this line for process debug
    spawnArgs.push("--inspect-brk=127.0.0.1:9221");

    //this line is used for allowing test debug
    if(isDebug) {
       // spawnArgs.push("--inspect=127.0.0.1:9221");
    }

    //add the module file path as a arg
    spawnArgs.push(mochaPath);

    spawnArgs.push("--reporter");
    spawnArgs.push("C:\\Git\\vscode-unit-test\\out\\mochaTestLanguageServer\\mochaRunner\\mochaReporter.js")
    spawnArgs.push("--reporter-options");
    spawnArgs.push(`port=${port}`)
    const childProcess = cp.spawn("node", spawnArgs, { cwd: cwd, stdio: [null, null, null] });

    childProcess.stdout.on("data", data => {
        console.log("STD_OUT: " + data);
    });

    childProcess.stderr.on("data", data => {
        console.log("STD_ERROR: " + data);
    });

    childProcess.on("exit", code => {
        console.log("exit: " + code);
    });


    console.log(`startMochaRunnerServer - ${mochaPath}`);

    return childProcess;
}
