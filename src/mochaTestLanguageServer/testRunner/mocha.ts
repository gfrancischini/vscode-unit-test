import * as fs from "fs"
import * as path from "path"
import { MochaCustomReporter } from "./mochaReporter"
import { mochaRunnerServer, initalize } from "./serverInstance"
import { RunParams, RunResult, TestSuiteUpdateType } from "./protocol"

let Mocha;

//wait the initliazation of the server instance
initalize(12345);

//when run command is rcvd we start runinng the tests
mochaRunnerServer.getConnection().onRun(async (params: RunParams) => {
    try {
        await run(params.mochaPath, params.mochaArguments.optsPath, params.filesDict)
    }
    catch (err) {
        console.log(err);
    }

    //send a message telling the client that we are end
    return {
        success : true
    }
})

/**
 * Dynamic creation of a mocha tester for each file
 * @param _mochaPath 
 * @param optsPath 
 * @param filesDict 
 */
async function run(_mochaPath : string, optsPath : string, filesDict: {}) {
    Mocha = require(path.join(_mochaPath, '../', '../'));
    const opts = optsPath ? getOptions(optsPath) : null;

    for (let path in filesDict) {
        try {
            const grep = filesDict[path];
            const mocha: Mocha = createMocha(path, grep, opts);
            const promise = await runMocha(path, mocha);
        }
        catch (err) {
            console.log(err);
        }
    }
}

/**
 * Run the dynamic mocha tester
 * @param path 
 * @param mocha 
 */
function runMocha(path: string, mocha: Mocha): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            mocha.run(() => {
                resolve();
            });
        } catch (err) {
            console.log("err: " + err);

            mochaRunnerServer.getConnection().testSuiteUpdate({
                type: TestSuiteUpdateType.Failure,
                testSuite: {
                    path,
                    fullTitle: "",
                    title: "",
                    err: {
                        message: err.message,
                        stack: err.stack
                    }
                }
            });

            resolve();
        }
    });
}

/**
 * Create the dynamic mocha tester
 * @param filePath 
 * @param grep 
 * @param opts 
 */
function createMocha(filePath: string, grep: string, opts?): Mocha {
    const mocha: Mocha = new Mocha({ ui: "bdd", timeout: 999999 });

    if (opts) {
        applyMochaOpts(opts, mocha);
    }

    // delete files from cache for re-evalutation
    delete require.cache[filePath];
    mocha.addFile(filePath);

    // only apply grep pattern if not null
    if (grep) {
        grep = `^(${grep})$`;
        //console.log(`\nGrep Pattern: ${grep}`);
        mocha.grep(new RegExp(grep, "i"));
    }

    (<any>mocha).reporter(MochaCustomReporter, { "port": 12345 });

    return mocha;
}

/**
 * Require the files
 * @param id 
 */
function managedRequire(id: string) {
    if (path.isAbsolute(id) === false && !path.extname) {
        //when the path is not absolute we should try to load it from node_modules folder
        id = path.join(process.cwd(), "node_modules", id);
    }
    else if (path.isAbsolute(id) === false) {
        id = path.join(process.cwd(), id);
    }
    try {
        if (!require.cache[id]) {
            //delete require.cache[id];
            require(id);
        }
    }
    catch (err) {
        console.log(`managedRequire(${id}) - ${err}`);
    }
}


/**
 * Apply the mocha options to the mocha
 * @param opts 
 * @param mocha 
 */
function applyMochaOpts(opts: Array<{key, value}>, mocha: Mocha) {
    opts.forEach(option => {
        switch (option.key) {
            case "--require":
                managedRequire(option.value);
                break;
            case "--ui":
                mocha.ui(option.value);
                break;
            case "--timeout":
                mocha.timeout(option.value);
                break;
        }
    });

}

/**
 * Read mocha.opts file
 * @param optsPath The path to read the file
 * @return Array of found options
 */
export function getOptions(optsPath): Array<{ key, value }> {
    try {
        const opts = fs.readFileSync(optsPath, 'utf8')
            .replace(/\\\s/g, '%20')
            .split(/\s/)
            .filter(Boolean)
            .map(value => value.replace(/%20/g, ' '));

        const options = new Array<{ key, value }>();
        if (opts) {
            for (let i = 0; i < opts.length; i = i + 2)
                options.push({ key: opts[i], value: opts[i + 1] });
        }
        return options;
    } catch (err) {
        return null;
    }
}