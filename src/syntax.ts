import fs from "fs";

const syntaxFile = fs.readFileSync(__dirname + "/syntax.txt", {
  encoding: "utf8",
  flag: "r",
});

const syntaxList = syntaxFile
  .split("\n")
  .filter((a) => a)
  .map((syntax) => syntax.split(/\s+/));

export const syntaxMap = syntaxList.reduce(
  (acc, [type, syntax]) => ({
    ...acc,
    [type]: syntax,
  }),
  {}
) as SyntaxMap;

export type SyntaxMap = {
  DEFINE: string;
  ASSIGN: string;

  OPENSEQ: string;
  CLOSESEQ: string;

  OPENFUNC: string;
  CLOSEFUNC: string;
  LAMBDA: string;

  IF: string;
  THEN: string;
  ELSE: string;

  OPENLIST: string;
  CLOSELIST: string;
  OPENMAP: string;
  CLOSEMAP: string;
  MAPDIVIDER: string;
  ACCESS: string;

  OPENSTRINGDOUBLE: string;
  CLOSESTRINGDOUBLE: string;
  OPENSTRINGSINGLE: string;
  CLOSESTRINGSINGE: string;
  ESCAPE: string;
  OPENINTERPOLATE: string;
  CLOSEINTERPOLATE: string;

  IGNORED: string;
};

//@ts-ignore
const { IGNORED, ...nonTrivialSyntax } = syntaxMap;

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
