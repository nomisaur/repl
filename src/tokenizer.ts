// const { y } = require("./utils");
import { y, toObject, log } from "./utils";

type RawToken = {
  type: "white" | "digit" | "word" | "syntax" | "unknown";
  value: string;
  isToken: true;
};

export type Token = {
  type: "end" | "digit" | "word" | "syntax" | "unknown";
  value: string;
  isToken: true;
  white: string;
};

const syntax =
  "( ) { } #[ [ ] \" ' . .. ... = == -> ! != > >= < <= & | ? ^ * / % + - ; ~{ }~ ~ \n \r".split(
    " "
  );

const syntaxMap = toObject(syntax);

const initialSyntaxChars = toObject(syntax.map((s) => s.charAt(0)));

const isReg = (reg) => (char) => reg.test(char);

const getter = (tester) => (characters) => {
  return y((iter) => (acc, chars) => {
    const [first, ...rest] = chars;
    return !chars.length || !tester(first)
      ? [acc, chars]
      : iter([...acc, first], rest);
  })([], characters);
};

const isWhiteSpace = isReg(/[^\S\r\n]/);
const getWhiteSpace = getter(isWhiteSpace);

const isDigit = isReg(/\d/);
const getDigit = getter(isDigit);

const isWord = isReg(/\w/);
const getWord = getter(isWord);

const isSyntax = (char) => initialSyntaxChars[char];

const wrapRawToken = (type, value): RawToken => ({
  isToken: true,
  type,
  value,
});

const getNextToken = (characters: string | string[]): [RawToken, string[]] => {
  const [first, ...tail] = characters;

  const dispatch = (getter, type): [RawToken, string[]] => {
    const [chars, rest] = getter(characters);
    return [wrapRawToken(type, chars.join("")), rest];
  };

  if (isWhiteSpace(first)) {
    return dispatch(getWhiteSpace, "white");
  }
  if (isDigit(first)) {
    return dispatch(getDigit, "digit");
  }
  if (isWord(first)) {
    return dispatch(getWord, "word");
  }
  if (isSyntax(first)) {
    const [second, ...rest] = tail;
    const firstTwo = [first, second].join("");
    const isTwoChars = syntaxMap[firstTwo];
    return [
      wrapRawToken("syntax", isTwoChars ? firstTwo : first),
      isTwoChars ? rest : tail,
    ];
  }
  return [wrapRawToken("unknown", first), tail];
};

const rawTokenize = (characters: string): RawToken[] => {
  return y((iter) => (acc, rest) => {
    if (!rest.length) return acc;
    const [token, leftovers] = getNextToken(rest);
    return iter([...acc, token], leftovers);
  })([], characters);
};

const addWhite = (token, white) => ({
  ...token,
  white,
});

const makeEndToken = (white) => ({
  isToken: true,
  type: "end",
  value: null,
  white,
});

export const tokenize = (characters: string): Token[] => {
  return y((iter) => (acc, tokens, previousWhite) => {
    const [first, ...rest] = tokens;
    if (!first) {
      return [...acc, makeEndToken(previousWhite)];
    }
    if (
      first.type === "white" ||
      first.value === "\n" ||
      first.value === "\r"
    ) {
      return iter(acc, rest, first.value);
    }
    return iter([...acc, addWhite(first, previousWhite)], rest, "");
  })([], rawTokenize(characters), "");
};

const tokenizeStream = () => {};
