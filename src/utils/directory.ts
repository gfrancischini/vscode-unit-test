import { GlobSync } from "glob"

export function getAllTestFilesInDirectory(directory, globExp) {
    const globPattern = `${directory}/${globExp}`;
    const fileTestList = new GlobSync(globPattern, null).found;

    return fileTestList;
}