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

  OPENSTRINGDOUBLE: '"',
  CLOSESTRINGDOUBLE: '"',
  OPENSTRINGSINGLE: "'",
  CLOSESTRINGSINGE: "'",
  ESCAPE: "\\",
  OPENINTERPOLATE: "\\{",
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
  ACCESS: ".",

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
  MODULO: "%",
  EXPONENT: "^",
};

export const priority = [
  [infixes.ACCESS],
  [infixes.EXPONENT],
  [infixes.MULTIPLY, infixes.DIVIDE, infixes.MODULO],
  [infixes.ADD, infixes.SUBTRACT],
  [
    infixes.LESSTHAN,
    infixes.GREATERTHAN,
    infixes.LESSTHANOREQ,
    infixes.GREATERTHANOREQ,
  ],
  [infixes.BEQ, infixes.NOTEQ],
  [infixes.AND],
  [infixes.OR],
];

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
