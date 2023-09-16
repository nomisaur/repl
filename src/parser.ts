import { y, log, debug, inspect } from "./utils";
import { tokenize, Token } from "./tokenizer";
debug.on = true;

type Expression = {
  isExpression: true;
  type: string;
  value: any;
  whiteSpace: string;
};

type ParseExpression = [Expression[], Token[]];

type GetExpression = [(Expression | never)[], (Token | never)[]];

const wrapExpression = (type, value, whiteSpace): Expression => ({
  isExpression: true,
  type,
  value,
  whiteSpace,
});

const isAssignment = (tokens) => {
  const [token, next] = tokens;
  return token?.value === "=" && next;
};

const parseAssignment = (id, tokens): GetExpression => {
  const [_eq, ...rest1] = tokens;
  const [[expression, ...restExpr], ...rest2] = parseExression(rest1);
  return [
    [
      wrapExpression("assignment", { id: id.value, expression }, id.white),
      ...restExpr,
    ],
    ...rest2,
  ];
};

const parseId = (id, tokens): GetExpression => {
  return [[wrapExpression("id", id.value, id.white)], tokens];
};

const parseEnd = (end): GetExpression => {
  return [[wrapExpression("end", null, end.white)], []];
};

const parseIf = (ifToken, tokens): GetExpression => {
  console.log("parse if", inspect({ ifToken, tokens }));

  const [[conditional], [thenToken, ...rest1]] = parseExression(tokens);

  const [[consequent], [maybeElseToken, ...rest2]] = parseExression(rest1);

  if (maybeElseToken.value !== "else") {
    return [
      [wrapExpression("if", { conditional, consequent }, ifToken.white)],
      [maybeElseToken, ...rest2],
    ];
  }

  const [[alternate], rest3] = parseExression(rest2);
  return [
    [
      wrapExpression(
        "if",
        { conditional, consequent, alternate },
        ifToken.white
      ),
    ],
    rest3,
  ];
};

const getExpression = (chunks: (Expression | Token)[]): GetExpression => {
  // console.log("getExpression", inspect(chunks));
  const [chunk, ...rest] = chunks;
  if ("isToken" in chunk) {
    if (chunk.type === "end") {
      return parseEnd(chunk);
    }
    if (chunk.type === "syntax") {
    }
    if (chunk.type === "word") {
      if (chunk.value === "if") {
        return parseIf(chunk, rest);
      }
      if (isAssignment(rest)) {
        return parseAssignment(chunk, rest);
      }
      return parseId(chunk, rest);
    }
    if (chunk.type === "digit") {
    }
    if (chunk.type === "unknown") {
    }
  }
  if ("isExpression" in chunk) {
    return [[chunk], rest as Token[]];
  }
  return [[], []];
};

const parseExression = (chunks): ParseExpression => {
  if (!chunks.length) return [[], []];
  return getExpression(chunks);
};

const parseProgram = (tokens: Token[]) => {
  return y((iter) => (acc, tokens) => {
    console.log("expressions", inspect(acc));
    const [expressions, restOfTokens] = parseExression(tokens);
    console.log("expressions results", inspect({ expressions, restOfTokens }));
    return !expressions.length
      ? acc
      : iter([...acc, ...expressions], restOfTokens);
  })([], tokens);
};

export const parse = (code: string) => {
  const tokens = tokenize(code);
  return parseProgram(tokens);
};
