import { loop, log, debug, inspect } from "./utils";
import { tokenize, Token } from "./tokenizer";
import { lex, infix, priority } from "./syntax";
import { parse } from "./parser";

// (define (eval-sequence exps env)
//   (cond ((last-exp? exps)
//          (eval (first-exp exps) env))
//         (else
//          (eval (first-exp exps) env)
//          (eval-sequence (rest-exps exps)
//                         env))))

const evalSequence = ({ body }, env) => {
  if (!body.length) {
    return "null";
  }
  const newEnv = extendEnv(env, {});
  return body.map((expr) => e(expr, newEnv))[body.length - 1];
};

const evalIf = ({ conditional, consequent, alternate }, env) => {
  if (e(conditional, env) === "true") {
    return e(consequent, env);
  }
  if (alternate) {
    return e(alternate, env);
  }
  return "null";
};

const evalDefine = (
  {
    assignment: {
      value: { id, expression },
    },
  },
  env
) => {
  if (env.vars[id]) return env.vars[id];
  env.vars[id] = e(expression, env);
  return env.vars[id];
};

const evalString = (parts, env) => {
  return parts
    .reduce((acc, part) => {
      return [
        ...acc,
        part.type === "string-part" ? part.value.body : e(part, env),
      ];
    }, [])
    .join("");
};

const extendEnv = (env, vars) => {
  return { vars, parent: env };
};

const apply = ({ func, args }, outerEnv) => {
  const { params, body, env } = e(func, outerEnv);

  const vars = params.reduce((acc, param, index) => {
    return { ...acc, [param.value.id]: e(args[index], env) };
  }, {});

  const newEnv = extendEnv(env, vars);
  return e(body, newEnv);
};

const lookupVariable = (id, env) => {
  if (env.vars[id]) return env.vars[id];
  if (!env.parent) return "null";
  return lookupVariable(id, env.parent);
};

const e = (expr, env) => {
  const { type, value } = expr;
  if (type === "id") {
    return lookupVariable(value.id, env);
  }
  if (type === "number") {
    return value.number;
  }
  if (type === "string") {
    return evalString(value, env);
  }
  if (type === "primitive") {
    return value.val;
  }
  if (type === "if") {
    return evalIf(value, env);
  }
  if (type === "sequence") {
    return evalSequence(value, env);
  }
  if (type === "let") {
    return evalDefine(value, env);
  }
  if (type === "lambda") {
    return { type, params: value.params, body: value.body, env };
  }
  if (type === "apply") {
    return apply(value, env);
  }
};

export const evaluate = (text) => {
  const ast = parse(text).slice(0, -1);

  const result = evalSequence({ body: ast }, { vars: {} });
  return result;
};

// while true
//
//
//
//
