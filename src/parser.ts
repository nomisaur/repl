import { y, log, debug, inspect } from "./utils";
import { tokenize, Token } from "./tokenizer";
debug.on = true;

type Expression = {
  type: string;
  value: any;
  whiteSpace: string;
  tokens?: { [key: string]: Token };
};

type Value = string | Token | Expression | ValueInterface | null;

interface ValueInterface {
  [key: string]: Value;
}

type ParseExpression = [Expression | null, Token[]];

const wrapExpression = (
  type: string,
  value: any,
  whiteSpace: string,
  tokens?: { [key: string]: Token }
): Expression => ({
  type,
  value,
  whiteSpace,
  tokens,
});

const isAssignment = (tokens: Token[]) => {
  const [token, next] = tokens;
  return token?.value === "=" && Boolean(next);
};

const parseAssignment = (id: Token, tokens: Token[]): ParseExpression => {
  const [equals, ...rest1] = tokens;
  const [expression, rest2] = parseExression(rest1);
  return [
    wrapExpression("assignment", { id: id.value, expression }, id.white, {
      equals,
    }),
    rest2,
  ];
};

const parseId = (id: Token, tokens: Token[]): ParseExpression => {
  const expression = wrapExpression("id", id.value, id.white);
  const [maybeArrow, ...restTokens] = tokens;
  if (maybeArrow.value == "->") {
    return parseLambda(expression, maybeArrow, restTokens);
  }
  return [expression, tokens];
};

const parseEnd = (end: Token): ParseExpression => {
  return [wrapExpression("end", null, end.white), []];
};

const parseIf = (ifToken: Token, tokens: Token[]): ParseExpression => {
  const [conditional, [thenToken, ...rest1]] = parseExression(tokens);
  const [consequent, [maybeElseToken, ...rest2]] = parseExression(rest1);
  if (maybeElseToken.value !== "else") {
    return [
      wrapExpression("if", { conditional, consequent }, ifToken.white, {
        then: thenToken,
      }),
      [maybeElseToken, ...rest2],
    ];
  }
  const [alternate, rest3] = parseExression(rest2);
  return [
    wrapExpression(
      "if",
      {
        conditional,
        consequent,
        alternate,
      },
      ifToken.white,
      {
        then: thenToken,
        else: maybeElseToken,
      }
    ),
    rest3,
  ];
};

const parseSequence = (
  openToken: Token,
  tokens: Token[],
  closeValue: string
): ParseExpression => {
  const [expressions, restTokens] = y((iter) => (acc, tokens2) => {
    const [maybeLeftCurly, ...restTokens] = tokens2;
    if (maybeLeftCurly.type === "end") {
      throw Error(`Missing '${closeValue}'`);
    }
    if (maybeLeftCurly.value === closeValue) {
      return [acc, restTokens];
    }
    const [expr, rest2] = parseExression([maybeLeftCurly, ...restTokens]);
    return iter([...acc, expr], rest2);
  })([], tokens);
  return [wrapExpression("sequence", expressions, openToken.white), restTokens];
};

const parseParens = (rightParen: Token, tokens: Token[]): ParseExpression => {
  const [parenBody, restTokens] = parseSequence(rightParen, tokens, ")");
  const [maybeArrow, ...restTokens2] = restTokens;
  if (parenBody === null) {
    throw Error("should not be possible");
  }
  if (maybeArrow.value === "->") {
    return parseLambda(parenBody, maybeArrow, restTokens2);
  }
  return parseApply(parenBody, restTokens);
};

const parseLambda = (
  params: Expression,
  arrow: Token,
  tokens: Token[]
): ParseExpression => {
  const [body, restTokens] = parseExression(tokens);
  // @ts-ignore
  if (body.type === "end") {
    throw Error("Lambda needs body");
  }
  return [wrapExpression("lambda", { params, arrow, body }, ""), restTokens];
};

const parseApply = (body: Expression, tokens: Token[]): ParseExpression => {
  const { value, whiteSpace } = body;
  const [func, ...funcBody] = value as Expression[];
  return [
    wrapExpression("apply", { function: func, body: funcBody }, whiteSpace),
    tokens,
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
      return parseSequence(token, rest, "}");
    }
    if (token.value === "(") {
      return parseParens(token, rest);
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
