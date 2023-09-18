import { loop, log, debug, inspect } from "./utils";
import { tokenize, Token } from "./tokenizer";
import { syntax } from "./syntax";
debug.on = true;

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
  return token?.value === syntax.ASSIGN && Boolean(next);
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
  if (maybeArrow.value === syntax.LAMBDA) {
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
  if (maybeElse_.value !== syntax.ELSE) {
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
        if (previousToken.value !== syntax.ESCAPE) return acc;
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
        if (!escaped && char === syntax.ESCAPE) {
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
      const isInterpolate = token.value === syntax.OPENINTERPOLATE;
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
    open_.value === syntax.OPENSTRINGDOUBLE
      ? syntax.CLOSESTRINGDOUBLE
      : syntax.CLOSESTRINGSINGE;
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
    (value) => value === syntax.CLOSEFUNC
  );
  const [maybeArrow, ...restTokens2] = restTokens;
  if (sequence === null) {
    throw Error("should not be possible");
  }
  if (maybeArrow.value === syntax.LAMBDA) {
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
    (c) => c === syntax.CLOSELIST
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
    (c) => c === syntax.CLOSEMAP,
    parseMapPart
  );
  return [wrapExpression("map", { open_, body, close_ }), restTokens];
};

const parseSequence = (open_: Token, tokens: Token[]): ParseExpression => {
  const [_, body, close_, restTokens] = getSequence(
    open_,
    tokens,
    (c) => c === syntax.CLOSESEQ
  );
  return [wrapExpression("sequence", { open_, body, close_ }), restTokens];
};

const parseAccess = (
  collection: Expression,
  access_: Token,
  tokens: Token[],
  acc
): ParseExpression => {
  const [key, [colon2_, ...tokens2]] = parseExpression(tokens, [
    ...acc,
    { collection, access_ },
  ]);
  if (key?.type === "access") {
    return [key, [colon2_, ...tokens2]];
  }
  if (colon2_.value !== syntax.ACCESS) {
    return [
      wrapExpression("access", [...acc, { collection, access_ }, { key }]),
      [colon2_, ...tokens2],
    ];
  }
  return [null, []];
};

const parseLookAheads = (token, rest): ParseExpression => {
  if (token.type === "number") {
    return parseNumber(token, rest);
  }
  if (token.type === "syntax") {
    if (
      token.value === syntax.OPENSTRINGDOUBLE ||
      token.value == syntax.OPENSTRINGSINGLE
    ) {
      return parseString(token, rest);
    }
    if (token.value === syntax.DEFINE) {
      return parseDefine(token, rest);
    }
    if (token.value === syntax.IF) {
      return parseIf(token, rest);
    }
    if (token.value === syntax.OPENSEQ) {
      return parseSequence(token, rest);
    }
    if (token.value === syntax.OPENFUNC) {
      return parseParens(token, rest);
    }
    if (token.value === syntax.OPENLIST) {
      return parseList(token, rest);
    }
    if (token.value === syntax.OPENMAP) {
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

const parseExpression = (tokens: Token[], acc?: any): ParseExpression => {
  if (!tokens.length) return [null, []];
  const [token, ...rest] = tokens;
  if (token.type === "end") {
    return parseEnd(token);
  }
  const [expression, tokens2] = parseLookAheads(token, rest);
  if (!tokens2.length || !expression) return [null, []];
  const [token2, ...rest2] = tokens2;
  if (token2.value === syntax.ACCESS) {
    return parseAccess(expression, token2, rest2, acc || []);
  }
  return [expression, tokens2];
};

const parseProgram = (tokens: Token[]): Expression[] => {
  const iter = (acc: Expression[], tokens: Token[]): Expression[] => {
    const [expression, restOfTokens] = parseExpression(tokens, []);
    return !expression ? acc : iter([...acc, expression], restOfTokens);
  };
  return iter([], tokens);
};

export const parse = (code: string) => {
  const tokens = tokenize(code);
  return parseProgram(tokens);
};
