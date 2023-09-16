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
  const [_eq, ...restA] = tokens;
  const [[expression, ...restExpr], ...restB] = parseExression(restA);
  return [
    [
      wrapExpression("assignment", { id: id.value, expression }, id.white),
      ...restExpr,
    ],
    ...restB,
  ];
};

const parseId = (id, tokens): GetExpression => {
  return [[wrapExpression("id", id.value, id.white)], tokens];
};

const parseEnd = (end): GetExpression => {
  return [[wrapExpression("end", null, end.white)], []];
};

const getExpression = (chunks): GetExpression => {
  // console.log("getExpression", inspect(chunks));
  const [chunk, ...rest] = chunks;
  if (chunk.isToken) {
    if (chunk.type === "end") {
      return parseEnd(chunk);
    }
    if (chunk.type === "syntax") {
    }
    if (chunk.type === "word") {
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
  if (chunk.isExpression) {
    return [chunk, rest];
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
    return !expressions.length
      ? acc
      : iter([...acc, ...expressions], restOfTokens);
  })([], tokens);
};

export const parse = (code: string) => {
  const tokens = tokenize(code);
  return parseProgram(tokens);
};
