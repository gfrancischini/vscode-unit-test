import * as cp from 'child_process';
import * as rpc from 'vscode-jsonrpc';
import * as path from "path";
import * as fs from "fs";


export function startServer(cwd: string) {
    const modulePath: string = path.join(path.dirname(module.filename), "..", "mochaTestLanguageServer", "mochaServer.js");

    const forkArgs: Array<any> = [];
    const spawnArgs = [];

    //uncoment this line for process debug
    //spawnArgs.push("--inspect-brk=127.0.0.1:9220");

    //this line is used for allowing test debug
    spawnArgs.push("--inspect=127.0.0.1:9220");

    //add the module file path as a arg
    spawnArgs.push(modulePath);

    const childProcess = cp.spawn("node", spawnArgs, { cwd: cwd, stdio: [null, null, null, "pipe", "pipe"] });

    childProcess.stdout.on("data", data => {
        //console.log("STD_OUT: " + data);
    });

    childProcess.stderr.on("data", data => {
        console.log("STD_ERROR: " + data);
    });

    childProcess.on("exit", code => {
        console.log("exit: " + code);
    });


    console.log(`startServer - ${modulePath}`);

    return childProcess;
}
