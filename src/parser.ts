import { y, log, debug, inspect } from "./utils";
import { tokenize, Token } from "./tokenizer";
debug.on = true;

type Expression = {
  type: string;
  value: Value;
  whiteSpace: string;
};

type Value = string | Token | Expression | ValueInterface | null;

interface ValueInterface {
  [key: string]: Value;
}

type ParseExpression = [Expression | null, Token[]];

const wrapExpression = (
  type: string,
  value: Value,
  whiteSpace: string
): Expression => ({
  type,
  value,
  whiteSpace,
});

const isAssignment = (tokens: Token[]) => {
  const [token, next] = tokens;
  return token?.value === "=" && Boolean(next);
};

const parseAssignment = (id: Token, tokens: Token[]): ParseExpression => {
  const [_eq, ...rest1] = tokens;
  const [expression, rest2] = parseExression(rest1);
  return [
    wrapExpression("assignment", { id: id.value, expression }, id.white),
    rest2,
  ];
};

const parseId = (id: Token, tokens: Token[]): ParseExpression => {
  return [wrapExpression("id", id.value, id.white), tokens];
};

const parseEnd = (end: Token): ParseExpression => {
  return [wrapExpression("end", null, end.white), []];
};

const parseIf = (ifToken: Token, tokens: Token[]): ParseExpression => {
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

const parseSequence = (rightCurly: Token, tokens: Token[]): ParseExpression => {
  const [expressions, restTokens] = y((iter) => (acc, tokens2) => {
    const [maybeLeftCurly, ...restTokens] = tokens2;
    if (maybeLeftCurly.value === "}") {
      return [acc, restTokens];
    }
    const [expr, rest2] = parseExression([maybeLeftCurly, ...restTokens]);
    return iter([...acc, expr], rest2);
  })([], tokens);
  return [
    wrapExpression("sequence", expressions, rightCurly.white),
    restTokens,
  ];
};

const parseExression = (tokens: Token[]): ParseExpression => {
  if (!tokens.length) return [null, []];
  const [token, ...rest] = tokens;
  if (token.type === "end") {
    return parseEnd(token);
  }
  if (token.type === "syntax") {
    if (token.value === "{") {
      return parseSequence(token, rest);
    }
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
  return [wrapExpression("unexpected", token, token.white), rest];
};

type ParseProgramIter = (acc: Expression[], tokens: Token[]) => Expression[];
const parseProgram = (tokens: Token[]): Expression[] => {
  return y((iter: ParseProgramIter) => (acc: Expression[], tokens: Token[]) => {
    const [expression, restOfTokens] = parseExression(tokens);
    return !expression ? acc : iter([...acc, expression], restOfTokens);
  })([], tokens);
};

export const parse = (code: string) => {
  const tokens = tokenize(code);
  return parseProgram(tokens);
};
