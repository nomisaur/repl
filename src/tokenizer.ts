// const { y } = require("./utils");
import { y, toObject } from "./utils";

export type Token = {
  type: "white" | "digit" | "word" | "syntax" | "unknown";
  value: string;
};

export type WrappedToken = {
  token: Token;
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

const getNextToken = (characters: string | string[]): [Token, string[]] => {
  const [first, ...tail] = characters;

  const dispatch = (getter, type): [Token, string[]] => {
    const [chars, rest] = getter(characters);
    return [{ type, value: chars.join("") }, rest];
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
      { type: "syntax", value: isTwoChars ? firstTwo : first },
      isTwoChars ? rest : tail,
    ];
  }
  return [{ type: "unknown", value: first }, tail];
};

export const tokenize = (characters: string): WrappedToken[] => {
  return y((iter) => (acc, rest) => {
    if (!rest.length) return acc;
    const [token, leftovers] = getNextToken(rest);
    return iter([...acc, { token }], leftovers);
  })([], characters);
};

const tokenizeStream = () => {};
