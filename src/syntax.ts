const syntax = {
  DEFINE: "let",
  ASSIGN: "=",

  OPENSEQ: "{",
  CLOSESEQ: "}",

  OPENFUNC: "(",
  CLOSEFUNC: ")",
  LAMBDA: "->",

  IF: "if",
  THEN: "then",
  ELSE: "else",

  OPENLIST: "[",
  CLOSELIST: "]",
  OPENMAP: "#[",
  CLOSEMAP: "]",
  MAPDIVIDER: ":",
  ACCESS: ".",

  OPENSTRINGDOUBLE: '"',
  CLOSESTRINGDOUBLE: '"',
  OPENSTRINGSINGLE: "'",
  CLOSESTRINGSINGE: "'",
  ESCAPE: "\\",
  OPENINTERPOLATE: "${",
  CLOSEINTERPOLATE: "}",

  IGNORED: ",",
};

export const primitive = {
  NULL: "null",
  TRUE: "true",
  FALSE: "false",
};

const unary = {
  NOT: "!",
};

const infixes = {
  BEQ: "==",
  NOTEQ: "!=",
  AND: "&",
  OR: "|",

  LESSTHAN: "<",
  GREATERTHAN: ">",
  LESSTHANOREQ: "<=",
  GREATERTHANOREQ: ">=",

  ADD: "+",
  SUBTRACT: "-",
  MULTIPLY: "*",
  DIVIDE: "/",
  EXPONENT: "^",
};

export const priority = [];

export const infix = Object.values(infixes);

export const lex = {
  ...syntax,
  ...primitive,
  ...unary,
  ...infixes,
};

//@ts-ignore
const { IGNORED, ...nonTrivialSyntax } = lex;

const escapeRegExp = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

export const lexRegex = new RegExp(
  `^(${Object.values(nonTrivialSyntax)
    //@ts-ignore
    // .flatMap(([type, syntax]) => syntax.map((s) => s), [])
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    // .map((s) => s.split("").join("\\"))
    .join("|")})`,
  "g"
);

export const ignoredRegex = new RegExp(`^(${escapeRegExp(IGNORED)})`);
