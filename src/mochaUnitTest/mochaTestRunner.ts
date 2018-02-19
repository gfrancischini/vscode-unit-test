import { MochaProcessArguments, MochaProcessArgumentsCallback, MochaProcessTestCaseUpdate, MochaProcessError, MochaTestFrameworkDetail } from "./mochaProcess/mochaProcessArguments";
import * as path from "path";
import * as fs from "fs";
import * as cp from "child_process";

export type TestProcessResponse = {
    results: any;
    stdout: string;
};

function runInternal(cwd: string, debug: boolean, mochaProcessArguments: MochaProcessArguments): any {
    const modulePath: string = path.join(path.dirname(module.filename), "MochaProcess", "MochaProcess.js");

    const forkArgs: Array<any> = [];

    //  fork the process so the entire test module runs in another thread.
    //this.mochaProcess = cp.fork(modulePath, forkArgs, { execArgv: [], cwd: cwd, silent: true });
    //this.mochaProcess = cp.fork(modulePath, forkArgs, { execArgv: [], cwd: cwd, silent: true });
    ////"--debug-brk", "--inspect=9222", 
    //let mochaProcessArgumentsString = JSON.stringify(mochaProcessArguments);

    const spawnArgs = [];
    //

    //if (debug) {
        //spawnArgs.push(`--debug=${6262}`);
        spawnArgs.push("--inspect=9220");
        spawnArgs.push("--debug-brk");
    //}
    spawnArgs.push(modulePath);

    this.mochaProcess = cp.spawn("node", spawnArgs, { cwd: cwd, stdio: ["pipe", "pipe", "pipe", "ipc"] });
    //this.mochaProcess = cp.fork(modulePath, forkArgs, { execArgv: [], cwd: cwd, silent: true });

    this.isKilledByTestFrameworkEnd = false;
    return new Promise<TestProcessResponse>((resolve, reject) => {
        let results: any;
        let stdout: string[] = [];
        let stderr: string[] = [];
        let stderrTimeout: NodeJS.Timer;
        this.mochaProcess.on("message", data => {
            //console.log(new Date().toISOString() + " - MESSAGE: " + data);
            this.mochaProcessDataCallback(data);
        });

        this.mochaProcess.stdout.on("data", data => {
            if (typeof data !== "string") {
                data = data.toString("utf8");
            }
            //console.log("STD_OUT: " + data);
            //stdout.push(data);
            //this.callDataReceivedListener(new MochaProcessArgumentsCallback("Info", data));
            this.mochaProcessStdOutCallback(data);
        });

        this.mochaProcess.stderr.on("data", data => {
            if (typeof data !== "string") {
                data = data.toString("utf8");
            }

            console.log("STD_ERROR: " + data);

            stderr.push(data);
            /*if (!stderrTimeout) {
                stderrTimeout = setTimeout(() => {
                    results = stderr.join("");
                    this.mochaProcess.kill();
                }, 500);
            }*/
        });

        this.mochaProcess.on("exit", code => {
            console.log("EXIT: " + code);
            if (code !== 0 && this.isKilledByTestFrameworkEnd === false) {
                reject(results);
            } else {
                resolve({
                    results,
                    stdout: stdout.join("")
                } as TestProcessResponse);
            }
        });

        if (debug) {
            // give debugger some time to properly attach itself before running tests
            setTimeout(() => {
                this.mochaProcess.send(mochaProcessArguments);
            }, 1000);
        } else {
            try {
                this.mochaProcess.send(mochaProcessArguments);
            }
            catch (err) {
                console.log("err: " + err);
            }
        }
    });
}