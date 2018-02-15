import {replaceAll} from "./string";
import * as path from "path";

export class PathUtils {
    public static comparePaths(pathA: string, pathB: string): boolean {
        return false;
    }

    public static normalizePath(path: string): string {
        let newPath: string = replaceAll(path, "/", "\\");
        return newPath;
    }

    public static replaceExtension(npath, ext) {
        if (typeof npath !== "string") {
            return npath;
        }

        if (npath.length === 0) {
            return npath;
        }

        var nFileName = path.basename(npath, path.extname(npath)) + ext;
        return path.join(path.dirname(npath), nFileName);
    }
}