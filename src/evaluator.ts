import { loop, log, debug, inspect } from "./utils";
import { tokenize, Token } from "./tokenizer";
import { lex, infix, priority } from "./syntax";
import { parse } from "./parser";

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

export const evaluate = (text) => {
  const ast = parse(text);
  const result = ast.map(eval_);
  return result;
};
