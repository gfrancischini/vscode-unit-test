import { GlobSync } from "glob"
import * as path from "path";

/**
 * Return a list of all test files in a given directory
 */
export function getAllTestFilesInDirectory(directory, globExp): Array<string> {
    let globPattern = path.join(directory, globExp);
    const fileTestList = new GlobSync(globPattern, null).found;
    return fileTestList;
}