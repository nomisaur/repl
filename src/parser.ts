import { loop, log, debug, inspect } from "./utils";
import { tokenize, Token } from "./tokenizer";
import { lex, infix, priority } from "./syntax";

type Expression = {
  type: string;
  value: any;
};

type ParseExpression =
  | [Expression | null, Token[]]
  | [Expression | null, Token[], any];

const wrapExpression = (type: string, value: any): Expression => ({
  type,
  value,
});

const isAssignment = (tokens: Token[]) => {
  const [token, next] = tokens;
  return token?.value === lex.ASSIGN && Boolean(next);
};

const parseAssignment = (id_: Token, tokens: Token[]): ParseExpression => {
  const [equals_, ...rest1] = tokens;
  const [expression, rest2] = parseExpression(rest1);
  return [
    wrapExpression("assignment", { id: id_.value, equals_, expression }),
    rest2,
  ];
};

const parseId = (id_: Token, tokens: Token[]): ParseExpression => {
  const id = wrapExpression("id", { id: id_.value, id_ });
  const [maybeArrow, ...restTokens] = tokens;
  if (maybeArrow.value === lex.LAMBDA) {
    return parseLambda(null, [id], null, maybeArrow, restTokens);
  }
  return [id, tokens];
};

const parseNumber = (number_: Token, tokens: Token[]): ParseExpression => {
  return [wrapExpression("number", { number: number_.value, number_ }), tokens];
};

const parseEnd = (end_: Token): ParseExpression => {
  return [wrapExpression("end", { end_ }), []];
};

const parseIf = (if_: Token, tokens: Token[]): ParseExpression => {
  const [conditional, [then_, ...rest1]] = parseExpression(tokens);
  const [consequent, [maybeElse_, ...rest2]] = parseExpression(rest1);
  if (maybeElse_.value !== lex.ELSE) {
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
  const [alternate, rest3] = parseExpression(rest2);
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

const getSequence = (
  open_: Token,
  tokens: Token[],
  closeMatcher: (value: string) => boolean,
  parser: (tokens: Token[]) => ParseExpression = parseExpression
): [Token, Expression[], Token, Token[]] => {
  const [expressions, [close_, ...restTokens]] = loop(
    (next, acc, tokens) => {
      const [maybeClose_, ...restTokens] = tokens;
      if (maybeClose_.type === "end") {
        throw Error(`Missing '${close}'`);
      }
      if (closeMatcher(maybeClose_.value)) {
        return [acc, [maybeClose_, ...restTokens]];
      }
      const [expr, rest2] = parser([maybeClose_, ...restTokens]);
      return next([...acc, expr], rest2);
    },
    [],
    tokens
  );
  return [open_, expressions, close_, restTokens];
};

const isEscaped = (previousTokens, token, isPartEnd) => {
  const escaped =
    isPartEnd &&
    loop(
      (next, previousTokens, token, acc) => {
        if (!previousTokens.length) return acc;
        if (token.irrelevant.lenth) return acc;
        const previousToken = previousTokens[previousTokens.length - 1];
        if (previousToken.value !== lex.ESCAPE) return acc;
        return next(previousTokens.slice(0, -1), previousToken, !acc);
      },
      previousTokens,
      token,
      false
    );
  return [escaped, escaped ? previousTokens.slice(0, -1) : previousTokens];
};

const parseEscapes = (text) =>
  text
    .split("")
    .reduce(
      ([acc, escaped], char) => {
        if (!escaped && char === lex.ESCAPE) {
          return [acc, true];
        }
        // \b	Backspace
        // \f	Form Feed
        // \n	New Line
        // \r	Carriage Return
        // \t	Horizontal Tabulator
        // \v	Vertical Tabulator
        if (escaped && char === "b") {
          return [[...acc, "\b"], false];
        }
        if (escaped && char === "f") {
          return [[...acc, "\f"], false];
        }
        if (escaped && char === "n") {
          return [[...acc, "\n"], false];
        }
        if (escaped && char === "r") {
          return [[...acc, "\b"], false];
        }
        if (escaped && char === "t") {
          return [[...acc, "\b"], false];
        }
        if (escaped && char === "v") {
          return [[...acc, "\b"], false];
        }
        return [[...acc, char], false];
      },
      [[], false]
    )[0]
    .join("");

const parseStringPart = ([open_, ...tokens], close) =>
  loop(
    (next, acc, tokens) => {
      const [token, ...rest] = tokens;
      const isEnd = token.value === close;
      const isInterpolate = token.value === lex.OPENINTERPOLATE;
      const isPartEnd = isEnd || isInterpolate;
      const [escaped, acc2] = isEscaped(acc, token, isPartEnd);
      if (!escaped && isPartEnd) {
        return [
          isEnd,
          wrapExpression("string-part", {
            open_,
            body: parseEscapes(
              [...acc2, ...token.irrelevant].map((t) => t.value).join("")
            ),
            close_: { ...token, irrelevant: [] },
          }),
          rest,
        ];
      }
      return next(
        [...acc2, ...token.irrelevant, { ...token, irrelevant: [] }],
        rest
      );
    },
    [],
    tokens
  );

const parseString = (open_: Token, tokens: Token[]): ParseExpression => {
  const close =
    open_.value === lex.OPENSTRINGDOUBLE
      ? lex.CLOSESTRINGDOUBLE
      : lex.CLOSESTRINGSINGE;
  return loop(
    (next, acc, tokens) => {
      const [hasFinished, part, rest] = parseStringPart(tokens, close);
      if (hasFinished) {
        return [wrapExpression("string", [...acc, part]), rest];
      }
      const [expression, rest2] = parseExpression(rest);
      return next([...acc, part, expression], rest2);
    },
    [],
    [open_, ...tokens]
  );
};

const parseParens = (open_: Token, tokens: Token[]): ParseExpression => {
  const [_, sequence, close_, restTokens] = getSequence(
    open_,
    tokens,
    (value) => value === lex.CLOSEFUNC
  );
  const [maybeArrow, ...restTokens2] = restTokens;
  if (sequence === null) {
    throw Error("should not be possible");
  }
  if (maybeArrow.value === lex.LAMBDA) {
    return parseLambda(open_, sequence, close_, maybeArrow, restTokens2);
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
  const [body, restTokens] = parseExpression(tokens);
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
  const [expression, rest3] = parseExpression(rest2);
  return [wrapExpression("let", { let_, id, equals_, expression }), rest3];
};

const parseList = (open_: Token, tokens: Token[]): ParseExpression => {
  const [_, body, close_, restTokens] = getSequence(
    open_,
    tokens,
    (c) => c === lex.CLOSELIST
  );
  return [wrapExpression("list", { open_, body, close_ }), restTokens];
};

const parseMapPart = (tokens: Token[]): ParseExpression => {
  const [key, rest] = parseExpression(tokens);
  const [access_, ...rest2] = rest;
  const [val, rest3] = parseExpression(rest2);
  return [wrapExpression("map-part", { key, access_, val }), rest3];
};

const parseMap = (open_: Token, tokens: Token[]): ParseExpression => {
  const [_, body, close_, restTokens] = getSequence(
    open_,
    tokens,
    (c) => c === lex.CLOSEMAP,
    parseMapPart
  );
  return [wrapExpression("map", { open_, body, close_ }), restTokens];
};

const parseSequence = (open_: Token, tokens: Token[]): ParseExpression => {
  const [_, body, close_, restTokens] = getSequence(
    open_,
    tokens,
    (c) => c === lex.CLOSESEQ
  );
  return [wrapExpression("sequence", { open_, body, close_ }), restTokens];
};

const parseAccess = (
  collection: Expression,
  access_: Token,
  tokens: Token[],
  acc
): ParseExpression => {
  const [key, [access2_, ...tokens2]] = parseExpression(tokens, [
    ...acc,
    { collection, access_ },
  ]);
  if (key?.type === "access") {
    return [key, [access2_, ...tokens2]];
  }
  if (access2_.value !== lex.ACCESS) {
    return [
      wrapExpression("access", [...acc, { collection, access_ }, { key }]),
      [access2_, ...tokens2],
    ];
  }
  return [null, []];
};

//for each priority level,
// go through chain, check if there

const parseInfixChain = (chain) => {
  const result = priority.reduce((chain, level) => {
    return loop(
      (next, feed, acc) => {
        const [expr1, op_, expr2, ...rest] = feed;
        if (!op_) return [...acc, ...feed];
        const isMatch = level.includes(op_.value);
        const group = wrapExpression("infix", { expr1, op_, expr2 });
        const nextAcc = isMatch ? acc : [...acc, expr1, op_];
        const nextFeed = isMatch ? [group, ...rest] : [expr2, ...rest];
        return next(nextFeed, nextAcc);
      },
      chain,
      []
    );
  }, chain)[0];
  return result;
};

const parseInfix = (
  expression: Expression,
  op_: Token,
  tokens: Token[],
  acc
): ParseExpression => {
  const [key, [op2_, ...tokens2]] = parseExpression(tokens, [
    ...acc,
    expression,
    op_,
  ]);
  if (key?.type === "infix") {
    return [key, [op2_, ...tokens2]];
  }
  if (!infix.includes(key?.value)) {
    return [
      parseInfixChain([...acc, expression, op_, key]),
      [op2_, ...tokens2],
    ];
  }
  return [null, []];
};

const parsePrimitive = (token_: Token, rest: Token[]): ParseExpression => {
  return [wrapExpression("primitive", { val: token_.value, token_ }), rest];
};

const parseUnary = (op_: Token, tokens: Token[]): ParseExpression => {
  const [expression, rest] = parseExpression(tokens, [], true);
  return [wrapExpression("unary", { op_, expression }), rest];
};

const parseLookAheads = (token, rest): ParseExpression => {
  if (token.type === "number") {
    return parseNumber(token, rest);
  }
  if (token.type === "lex") {
    if (
      token.value === lex.TRUE ||
      token.value === lex.FALSE ||
      token.value === lex.NULL
    ) {
      return parsePrimitive(token, rest);
    }
    if (token.value === "-" || token.value === "+" || token.value === lex.NOT) {
      return parseUnary(token, rest);
    }
    if (
      token.value === lex.OPENSTRINGDOUBLE ||
      token.value == lex.OPENSTRINGSINGLE
    ) {
      return parseString(token, rest);
    }
    if (token.value === lex.DEFINE) {
      return parseDefine(token, rest);
    }
    if (token.value === lex.IF) {
      return parseIf(token, rest);
    }
    if (token.value === lex.OPENSEQ) {
      return parseSequence(token, rest);
    }
    if (token.value === lex.OPENFUNC) {
      return parseParens(token, rest);
    }
    if (token.value === lex.OPENLIST) {
      return parseList(token, rest);
    }
    if (token.value === lex.OPENMAP) {
      return parseMap(token, rest);
    }
  }
  if (token.type === "word") {
    if (isAssignment(rest)) {
      return parseAssignment(token, rest);
    }
    return parseId(token, rest);
  }
  if (token.type === "unknown") {
  }
  return [wrapExpression("unexpected", token), rest];
};

const parseLookBehinds = (
  expression,
  token,
  tokens,
  acc = []
): ParseExpression => {
  if (token.value === lex.ACCESS) {
    return parseAccess(expression, token, tokens, acc);
  }
  if (infix.includes(token.value)) {
    return parseInfix(expression, token, tokens, acc);
  }
  return [expression, [token, ...tokens]];
};

const parseExpression = (
  tokens: Token[],
  acc?: any,
  skipLookBehinds?: boolean
): ParseExpression => {
  if (!tokens.length) return [null, []];
  const [token, ...rest] = tokens;
  if (token.type === "end") {
    return parseEnd(token);
  }
  const [expression, tokens2] = parseLookAheads(token, rest);
  if (!tokens2.length || !expression) return [null, []];
  const [token2, ...rest2] = tokens2;
  if (!skipLookBehinds) {
    return parseLookBehinds(expression, token2, rest2, acc);
  }
  return [expression, tokens2];
};

const parseProgram = (tokens: Token[]): Expression[] => {
  const iter = (acc: Expression[], tokens: Token[]): Expression[] => {
    const [expression, restOfTokens] = parseExpression(tokens);
    return !expression ? acc : iter([...acc, expression], restOfTokens);
  };
  return iter([], tokens);
};

export const parse = (code: string) => {
  const tokens = tokenize(code);
  return parseProgram(tokens);
};
