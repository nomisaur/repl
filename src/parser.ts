import { y, log, debug, inspect } from "./utils";
import { tokenize, Token } from "./tokenizer";
debug.on = true;

type Expression = {
  type: string;
  value: any;
  whiteSpace: string;
};

type ParseExpression = [Expression | null, Token[]];

const wrapExpression = (type, value, whiteSpace): Expression => ({
  type,
  value,
  whiteSpace,
});

const isAssignment = (tokens) => {
  const [token, next] = tokens;
  return token?.value === "=" && next;
};

const parseAssignment = (id, tokens): ParseExpression => {
  const [_eq, ...rest1] = tokens;
  const [expression, ...rest2] = parseExression(rest1);
  return [
    wrapExpression("assignment", { id: id.value, expression }, id.white),
    ...rest2,
  ];
};

const parseId = (id, tokens): ParseExpression => {
  return [wrapExpression("id", id.value, id.white), tokens];
};

const parseEnd = (end): ParseExpression => {
  return [wrapExpression("end", null, end.white), []];
};

const parseIf = (ifToken, tokens): ParseExpression => {
  const [conditional, [_thenToken, ...rest1]] = parseExression(tokens);
  const [consequent, [maybeElseToken, ...rest2]] = parseExression(rest1);
  if (maybeElseToken.value !== "else") {
    return [
      wrapExpression("if", { conditional, consequent }, ifToken.white),
      [maybeElseToken, ...rest2],
    ];
  }
  const [alternate, rest3] = parseExression(rest2);
  return [
    wrapExpression("if", { conditional, consequent, alternate }, ifToken.white),
    rest3,
  ];
};

const parseExression = (tokens: Token[]): ParseExpression => {
  if (!tokens.length) return [null, []];
  const [token, ...rest] = tokens;
  if (token.type === "end") {
    return parseEnd(token);
  }
  if (token.type === "syntax") {
  }
  if (token.type === "word") {
    if (token.value === "if") {
      return parseIf(token, rest);
    }
    if (isAssignment(rest)) {
      return parseAssignment(token, rest);
    }
    return parseId(token, rest);
  }
  if (token.type === "digit") {
  }
  if (token.type === "unknown") {
  }
  return [null, []];
};

const parseProgram = (tokens: Token[]) => {
  return y((iter) => (acc, tokens) => {
    const [expression, restOfTokens] = parseExression(tokens);
    return !expression ? acc : iter([...acc, expression], restOfTokens);
  })([], tokens);
};

export const parse = (code: string) => {
  const tokens = tokenize(code);
  return parseProgram(tokens);
};
