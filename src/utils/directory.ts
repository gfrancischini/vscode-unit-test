import { GlobSync } from "glob"
import * as path from "path";
export function getAllTestFilesInDirectory(directory, globExp) {
    let globPattern = path.join(directory, globExp);
    const fileTestList = new GlobSync(globPattern, null).found;

    return fileTestList;
}