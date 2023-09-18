export const syntax = {
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
  ACCESS: ";",

  OPENSTRINGDOUBLE: '"',
  CLOSESTRINGDOUBLE: '"',
  OPENSTRINGSINGLE: "'",
  CLOSESTRINGSINGE: "'",
  ESCAPE: "\\",
  OPENINTERPOLATE: ".{",
  CLOSEINTERPOLATE: "}",

  IGNORED: ",",
};

//@ts-ignore
const { IGNORED, ...nonTrivialSyntax } = syntax;

const escapeRegExp = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

export const syntaxRegex = new RegExp(
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
