import { y, log, debug } from "./utils";
import { tokenize, Token, WrappedToken } from "./tokenizer";
debug.on = true;

const parseSequence = (tokens) => {
  debug("Sequence", tokens);
  return y((iter) => (tokens, acc) => {
    debug("Sequence_Iter", { tokens, acc });
    const [first, ...rest] = tokens;
    if (!first) {
      throw Error("missing '}'");
    }
    if (first.token.value === "}") {
      return [{ type: "sequence", value: acc }, ...rest];
    }
    const [expr, ...others] = parseExression(tokens);
    return iter(others, [...acc, expr]);
  })(tokens, []);
};

const parseIf = (tokens) => {
  debug("If:", tokens);
  const [condition, ...rest] = parseExression(tokens);
  debug("If_cond", { condition, rest });
  const [consequent, ...rest2] = parseExression(rest);
  debug("If_consequent", { consequent, rest2 });
  if (consequent.type !== "then") {
    throw Error("missing 'then' keyword");
  }
  const [alternate, ...rest3] = rest2.length ? parseExression(rest2) : [];
  debug("If_alt", { alternate, rest3 });
  const hasElse = alternate?.type === "else";
  const result = [
    {
      type: "if",
      condition,
      consequent: consequent.value,
      ...(hasElse ? { alternate: alternate.value } : {}),
    },
    ...(!hasElse && alternate ? [alternate] : []),
    ...rest3,
  ];
  debug("If_return", result);
  return result;
};

const parseThen = (tokens) => {
  debug("Then:", tokens);
  const [value, ...rest] = parseExression(tokens);
  return [{ type: "then", value }, ...rest];
};

const parseElse = (tokens) => {
  debug("Else:", tokens);
  const [value, ...rest] = parseExression(tokens);
  return [{ type: "else", value }, ...rest];
};

const parseLet = (tokens) => {
  debug("Let: ", tokens);
  const [assignment, ...rest] = parseExression(tokens);
  if (assignment.type !== "assignment") {
    throw Error("must have assignment after 'let'");
  }
  return [{ type: "let", value: assignment }, ...rest];
};

const parseId = (id, tokens) => {
  debug("Id:", { incomingId: id, tokens });
  const [expr, ...rest] = parseExression(tokens);
  if (expr && expr.type === "eq") {
    const [expression, ...rest2] = parseExression(rest);
    return [{ type: "assignment", id, expression }, ...rest2];
  }
  return [{ type: "id", value: id.value }, ...tokens];
};

const keyWords = {
  let: parseLet,
  if: parseIf,
  then: parseThen,
  else: parseElse,
};

const parseExression = (tokens) => {
  debug("Expression", tokens);
  if (!tokens.length) return [];
  const [WrappedToken, ...tail] = tokens;
  const { token } = WrappedToken;
  if (!token) {
    return [WrappedToken, ...tail];
  }
  if (token.type === "white") {
    return parseExression(tail);
  }
  if (token.value === "{") {
    return parseSequence(tail);
  }
  if (token.value === "=") {
    return [{ type: "eq" }, ...tail];
  }
  if (token.type === "word") {
    return keyWords[(token as Token).value]
      ? keyWords[(token as Token).value](tail)
      : parseId(token, tail);
  }
  return [token, ...tail];
};

const parseProgram = (tokens: WrappedToken[]) => {
  return y((iter) => (tokens, acc) => {
    debug("Program_Iter", { tokens, acc });
    const [expr, ...others] = parseExression(tokens);
    debug("Iter_close", { expr, others });
    return expr ? iter(others, [...acc, expr]) : acc;
  })(tokens, []);
};

export const parse = (code: string) => {
  const tokens = tokenize(code);
  debug("tokens", tokens);
  return parseProgram(tokens);
};
