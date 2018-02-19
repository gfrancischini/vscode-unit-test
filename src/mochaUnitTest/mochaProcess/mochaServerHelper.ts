import * as cp from 'child_process';
import * as rpc from 'vscode-jsonrpc';
import * as path from "path";
import * as fs from "fs";

export function startServer(cwd: string) {
    const modulePath: string = path.join(path.dirname(module.filename), "mochaServer.js");

    const forkArgs: Array<any> = [];
    const spawnArgs = [];

    //spawnArgs.push("--inspect=9220");
    //spawnArgs.push("--debug-brk");
    //spawnArgs.push("--inspect-brk=127.0.0.1:9220");
    spawnArgs.push(modulePath);

    const childProcess = cp.spawn("node", spawnArgs, { cwd: cwd, stdio: ["pipe", "pipe", "pipe", "ipc"] });

    childProcess.on("message", data => {
        console.log(new Date().toISOString() + " - MESSAGE: " + data);
    });

    childProcess.stdout.on("data", data => {
        console.log("STD_OUT: " + data);
    });

    childProcess.stderr.on("data", data => {
        console.log("STD_ERROR: " + data);
    });

    childProcess.on("exit", code => {
        console.log("exit");
    });


    console.log(`startServer - ${modulePath}`);

    return childProcess;
}
