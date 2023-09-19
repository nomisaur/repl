"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluate = void 0;
const parser_1 = require("./parser");
const evalIf = ({ conditional, consequent, alternate }, env) => {
    if (eval_(conditional, env) === "true") {
        return eval_(consequent, env);
    }
    if (alternate) {
        return eval_(alternate, env);
    }
    return "null";
};
const eval_ = (expr, env) => {
    const { type, value } = expr;
    if (type === "number") {
        return value.number;
    }
    if (expr.type === "primitive") {
        return value.val;
    }
    if (expr.type === "if") {
        return evalIf(value, env);
    }
};
const evaluate = (text) => {
    const ast = (0, parser_1.parse)(text);
    const result = ast.map(eval_);
    return result[0];
};
exports.evaluate = evaluate;
