import { y, log, debug, inspect } from "./utils";
import { tokenize, Token } from "./tokenizer";
debug.on = true;

type Expression = {
  type: string;
  value: any;
};

type Value = string | Token | Expression | ValueInterface | null;

interface ValueInterface {
  [key: string]: Value;
}

type ParseExpression = [Expression | null, Token[]];

const wrapExpression = (type: string, value: any): Expression => ({
  type,
  value,
});

const isAssignment = (tokens: Token[]) => {
  const [token, next] = tokens;
  return token?.value === "=" && Boolean(next);
};

const parseAssignment = (id_: Token, tokens: Token[]): ParseExpression => {
  const [equals_, ...rest1] = tokens;
  const [expression, rest2] = parseExression(rest1);
  return [
    wrapExpression("assignment", { id: id_.value, equals_, expression }),
    rest2,
  ];
};

const parseId = (id_: Token, tokens: Token[]): ParseExpression => {
  const id = wrapExpression("id", id_.value);
  const [maybeArrow, ...restTokens] = tokens;
  if (maybeArrow.value == "->") {
    return parseLambda(null, [id], null, maybeArrow, restTokens);
  }
  return [id, tokens];
};

const parseEnd = (end_: Token): ParseExpression => {
  return [wrapExpression("end", { end_ }), []];
};

const parseIf = (if_: Token, tokens: Token[]): ParseExpression => {
  const [conditional, [then_, ...rest1]] = parseExression(tokens);
  const [consequent, [maybeElse_, ...rest2]] = parseExression(rest1);
  if (maybeElse_.value !== "else") {
    return [
      wrapExpression("if", {
        if_,
        conditional,
        then_,
        consequent,
      }),
      [maybeElse_, ...rest2],
    ];
  }
  const [alternate, rest3] = parseExression(rest2);
  return [
    wrapExpression("if", {
      if_,
      conditional,
      then_,
      consequent,
      else_: maybeElse_,
      alternate,
    }),
    rest3,
  ];
};

const destructureSequence = (
  sequence: Expression | null
): [Token, Expression[], Token] => {
  return [
    // @ts-ignore
    sequence.value.open_,
    // @ts-ignore
    sequence.value.expressions,
    // @ts-ignore
    sequence.value.close_,
  ];
};

const parseSequence = (
  open_: Token,
  tokens: Token[],
  close: string
): ParseExpression => {
  const [expressions, [close_, ...restTokens]] = y((iter) => (acc, tokens) => {
    const [maybeClose_, ...restTokens] = tokens;
    if (maybeClose_.type === "end") {
      throw Error(`Missing '${close}'`);
    }
    if (maybeClose_.value === close) {
      return [acc, [maybeClose_, ...restTokens]];
    }
    const [expr, rest2] = parseExression([maybeClose_, ...restTokens]);
    return iter([...acc, expr], rest2);
  })([], tokens);
  return [
    wrapExpression("sequence", {
      open_,
      expressions,
      close_,
    }),
    restTokens,
  ];
};

const parseParens = (open_: Token, tokens: Token[]): ParseExpression => {
  const [sequence, restTokens] = parseSequence(open_, tokens, ")");
  const [_, sequenceBody, close_] = destructureSequence(sequence);
  const [maybeArrow, ...restTokens2] = restTokens;
  if (sequenceBody === null) {
    throw Error("should not be possible");
  }
  if (maybeArrow.value === "->") {
    return parseLambda(open_, sequenceBody, close_, maybeArrow, restTokens2);
  }
  //@ts-ignore
  return parseApply(open_, sequenceBody, close_, restTokens);
};

const parseLambda = (
  open_: Token | null,
  params: Expression[],
  close_: Token | null,
  arrow_: Token,
  tokens: Token[]
): ParseExpression => {
  const [body, restTokens] = parseExression(tokens);
  // @ts-ignore
  if (body.type === "end") {
    throw Error("Lambda needs body");
  }
  return [
    wrapExpression("lambda", {
      open_,
      params,
      close_,
      arrow_,
      body,
    }),
    restTokens,
  ];
};

const parseApply = (
  open_: Token,
  body: Expression[],
  close_: Token,
  tokens: Token[]
): ParseExpression => {
  const [func, ...args] = body;
  return [
    wrapExpression("apply", {
      open_,
      func,
      args,
      close_,
    }),
    tokens,
  ];
};

const parseDefine = (let_: Token, tokens: Token[]): ParseExpression => {
  const [id_, ...rest1] = tokens;
  const [id, [equals_, ...rest2]] = parseId(id_, rest1);
  const [expression, rest3] = parseExression(rest2);
  return [wrapExpression("let", { let_, id, equals_, expression }), rest3];
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
    if (token.value === "let") {
      return parseDefine(token, rest);
    }
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
  return [wrapExpression("unexpected", token), rest];
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
