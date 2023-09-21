"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = exports.getNextToken = exports.getNextRawToken = void 0;
const utils_1 = require("./utils");
const syntax_1 = require("./syntax");
const numberRegex = /(^(\d)(\d|(,\d))*(\.((\d)(\d|(,\d))*)){0,1})|(^(\.)(\d|(,\d))+)/g;
const wordRegex = /^[A-Za-z_?]\w*/g;
const whitespaceRegex = /^\s+/g;
const commentRegex = /(^~{(.|\n)*}~)|(^~.*((?=\n)|$))/g;
const matcher = (type, chars, regex) => {
    const result = chars.match(regex);
    if (result) {
        const [value] = result;
        return [{ type, value, isToken: true }, chars.slice(value.length)];
    }
    return null;
};
const getNextRawToken = (characters) => {
    const ignored = matcher("ignored", characters, syntax_1.ignoredRegex);
    if (ignored)
        return ignored;
    const syntax = matcher("lex", characters, syntax_1.lexRegex);
    if (syntax)
        return syntax;
    const number = matcher("number", characters, numberRegex);
    if (number)
        return number;
    const word = matcher("word", characters, wordRegex);
    if (word)
        return word;
    const whitespace = matcher("whitespace", characters, whitespaceRegex);
    if (whitespace)
        return whitespace;
    const comment = matcher("comment", characters, commentRegex);
    if (comment)
        return comment;
    return [
        { type: "unknown", value: characters[0], isToken: true },
        characters.slice(1),
    ];
};
exports.getNextRawToken = getNextRawToken;
const getNextToken = (characters) => (0, utils_1.loop)((next, irrelevant, chars) => {
    if (chars === "") {
        return [{ type: "end", value: "", irrelevant, isToken: true }, ""];
    }
    const [rawToken, rest] = (0, exports.getNextRawToken)(chars);
    if (rawToken.type === "whitespace" ||
        rawToken.type === "ignored" ||
        rawToken.type === "comment") {
        return next([...irrelevant, rawToken], rest);
    }
    return [{ ...rawToken, irrelevant }, rest];
}, [], characters);
exports.getNextToken = getNextToken;
const getAllTokens = (characters) => (0, utils_1.loop)((next, acc, rest) => {
    const [token, leftovers] = (0, exports.getNextToken)(rest);
    if (token.type === "end")
        return [...acc, token];
    return next([...acc, token], leftovers);
}, [], characters);
const tokenize = (characters) => {
    const tokens = getAllTokens(characters);
    // console.log("tokens:", tokens);
    return tokens;
};
exports.tokenize = tokenize;
// make streamable, sorta
// const makeGetter = (moreTokens) => {
//   let characters = "";
//   return async () => {
//     if (!characters.length) {
//       characters = await moreTokens();
//     }
//     const [token, rest] = getNextToken(characters);
//     characters = rest;
//     return token;
//   };
// };
// const nextToken = makeGetter(async () => promptUser());
// const token = await nextToken();
