export function replaceAll(target, search, replacement) {
    return target.replace(new RegExp(search, "g"), replacement);
};

/**
 * Escapes the RegExp special characters "^", "$", "\", "/", ".", "*", "+", "?",
 * "(", ")", "[", "]", "{", "}", "|", ":", "!", and "=" in string.
 *
 * @param {String} string
 * @return {String}
 * @api public
 */

export function escapeRegex(string){
    return ('' + string).replace(/([?!${}*:()|=^[\]\/\\.+])/g, '\\$1');
}