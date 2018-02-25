import { MochaRunnerServer } from "./server"
export let mochaRunnerServer: MochaRunnerServer = null

/**
 * Initialize the mochaRunnerService
 * @param port 
 */
export async function initalize(port: number) {
    if (mochaRunnerServer == null) {
        mochaRunnerServer = new MochaRunnerServer(port);
        await mochaRunnerServer.connectServer();
    }
}