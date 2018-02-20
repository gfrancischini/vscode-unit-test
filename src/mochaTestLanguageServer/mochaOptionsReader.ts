import * as fs from "fs";

/**
 * Get options.
 */
export function getOptions(optsPath) {
    try {
        const opts = fs.readFileSync(optsPath, 'utf8')
            .replace(/\\\s/g, '%20')
            .split(/\s/)
            .filter(Boolean)
            .map(value => value.replace(/%20/g, ' '));

        const options = new Array<{}>();
        if (opts) {
            for (let i = 0; i < opts.length; i = i + 2)
                options.push({ key: opts[i], value: opts[i + 1] });
        }
        return options;
    } catch (err) {
        return null;
    }
}