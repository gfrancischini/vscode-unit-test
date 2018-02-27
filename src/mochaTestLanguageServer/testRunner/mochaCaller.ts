import * as path from "path"
import * as cp from "child_process";

export function getMochaServerPath() : string{
    const modulePath: string = path.join(path.dirname(module.filename), "mocha.js");
    return modulePath;
}

export function startMochaRunnerServer(cwd: string, port : number) : cp.ChildProcess {
    const forkArgs: Array<any> = [];
    const spawnArgs = [];

    //uncoment this line for process debug
    //spawnArgs.push("--inspect-brk=127.0.0.1:9221");

    //push the program path
    spawnArgs.push(getMochaServerPath());
    spawnArgs.push(`--port=${port}`)
  
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


    console.log(`startMochaRunnerServer on port ${port}`);

    return childProcess;
}
