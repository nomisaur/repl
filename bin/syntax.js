"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ignoredRegex = exports.lexRegex = exports.lex = exports.infix = exports.priority = exports.primitive = void 0;
const syntax = {
    DEFINE: "let",
    ASSIGN: "=",
    OPENSEQ: "{",
    CLOSESEQ: "}",
    OPENFUNC: "(",
    CLOSEFUNC: ")",
    LAMBDA: "->",
    IF: "if",
    THEN: "then",
    ELSE: "else",
    OPENLIST: "[",
    CLOSELIST: "]",
    OPENMAP: "#[",
    CLOSEMAP: "]",
    MAPDIVIDER: ":",
    OPENSTRINGDOUBLE: '"',
    CLOSESTRINGDOUBLE: '"',
    OPENSTRINGSINGLE: "'",
    CLOSESTRINGSINGE: "'",
    ESCAPE: "\\",
    OPENINTERPOLATE: "${",
    CLOSEINTERPOLATE: "}",
    IGNORED: ",",
};
exports.primitive = {
    NULL: "null",
    TRUE: "true",
    FALSE: "false",
};
const unary = {
    NOT: "!",
};
const infixes = {
    ACCESS: ".",
    BEQ: "==",
    NOTEQ: "!=",
    AND: "&",
    OR: "|",
    LESSTHAN: "<",
    GREATERTHAN: ">",
    LESSTHANOREQ: "<=",
    GREATERTHANOREQ: ">=",
    ADD: "+",
    SUBTRACT: "-",
    MULTIPLY: "*",
    DIVIDE: "/",
    MODULO: "%",
    EXPONENT: "^",
};
exports.priority = [
    [infixes.ACCESS],
    [infixes.EXPONENT],
    [infixes.MULTIPLY, infixes.DIVIDE, infixes.MODULO],
    [infixes.ADD, infixes.SUBTRACT],
    [
        infixes.LESSTHAN,
        infixes.GREATERTHAN,
        infixes.LESSTHANOREQ,
        infixes.GREATERTHANOREQ,
    ],
    [infixes.BEQ, infixes.NOTEQ],
    [infixes.AND],
    [infixes.OR],
];
exports.infix = Object.values(infixes);
exports.lex = {
    ...syntax,
    ...exports.primitive,
    ...unary,
    ...infixes,
};
//@ts-ignore
const { IGNORED, ...nonTrivialSyntax } = exports.lex;
const escapeRegExp = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
exports.lexRegex = new RegExp(`^(${Object.values(nonTrivialSyntax)
    //@ts-ignore
    // .flatMap(([type, syntax]) => syntax.map((s) => s), [])
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    // .map((s) => s.split("").join("\\"))
    .join("|")})`, "g");
exports.ignoredRegex = new RegExp(`^(${escapeRegExp(IGNORED)})`);
