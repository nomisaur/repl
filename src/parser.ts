import { y, log, debug, inspect } from "./utils";
import { tokenize, Token } from "./tokenizer";
debug.on = true;

type Expression = {
  isExpression: true;
  type: string;
  value: any;
  whiteSpace: string;
};

type ParseExpression = [Expression | null, Token[]];

type GetExpression = [Expression | null, Token[]];

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
  const [expression, ...rest2] = parseExression(rest1);
  return [
    wrapExpression("assignment", { id: id.value, expression }, id.white),
    ...rest2,
  ];
};

const parseId = (id, tokens): GetExpression => {
  return [wrapExpression("id", id.value, id.white), tokens];
};

const parseEnd = (end): GetExpression => {
  return [wrapExpression("end", null, end.white), []];
};

const parseIf = (ifToken, tokens): GetExpression => {
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
    return [chunk, rest as Token[]];
  }
  return [null, []];
};

const parseExression = (chunks): ParseExpression => {
  if (!chunks.length) return [null, []];
  return getExpression(chunks);
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
