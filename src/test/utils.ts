import * as path from "path"

export function getTestFilePath(module: string, name: string): string {
    return path.join(__filename, "..", "..", "..", "test", "cases", module, name);
}