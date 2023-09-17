import { loop } from "./utils";

import { syntaxRegex, ignoredRegex } from "./syntax";

type RawToken = {
  type:
    | "whitespace"
    | "number"
    | "word"
    | "syntax"
    | "ignored"
    | "comment"
    | "unknown";
  value: string;
  isToken: true;
};

export type Token = {
  type: "end" | "number" | "word" | "syntax" | "unknown";
  value: string;
  isToken: true;
  trivial: RawToken[];
};

const numberRegex =
  /(^(\d)(\d|(,\d))*(.((\d)(\d|(,\d))*)){0,1})|(^(\.)(\d|(,\d))+)/g;

const wordRegex = /^[A-Za-z_]\w*/g;

const whitespaceRegex = /^\s+/g;

const commentRegex = /(^~{(.|\n)*}~)|(^~.*((?=\n)|$))/g;

const matcher = (type, chars, regex) => {
  const result = chars.match(regex);
  if (result) {
    const [value] = result;
    return [{ type, value, isToken: true }, chars.slice(value.length)];
  }
  return null;
};

export const getNextToken = (characters) => {
  const ignored = matcher("ignored", characters, ignoredRegex);
  if (ignored) return ignored;
  const syntax = matcher("syntax", characters, syntaxRegex);
  if (syntax) return syntax;
  const number = matcher("number", characters, numberRegex);
  if (number) return number;
  const word = matcher("word", characters, wordRegex);
  if (word) return word;
  const whitespace = matcher("whitespace", characters, whitespaceRegex);
  if (whitespace) return whitespace;
  const comment = matcher("comment", characters, commentRegex);
  if (comment) return comment;
  return [
    { type: "unknown", value: characters[0], isToken: true },
    characters.slice(1),
  ];
};

const getAllTokens = (characters: string): RawToken[] =>
  loop(
    (next, acc, rest) => {
      if (!rest.length) return acc;
      const [token, leftovers] = getNextToken(rest);
      return next([...acc, token], leftovers);
    },
    [],
    characters
  );

const rollupIrrelevant = (tokens) =>
  loop(
    (next, [accTokens, irrelevant, tokens]) => {
      if (!tokens.length)
        return [
          ...accTokens,
          { type: "end", value: "", irrelevant, isToken: true },
        ];
      const [token, ...rest] = tokens;
      return next(
        token.type === "whitespace" ||
          token.type === "ignored" ||
          token.type === "comment"
          ? [accTokens, [...irrelevant, token], rest]
          : [[...accTokens, { ...token, irrelevant }], [], rest]
      );
    },
    [[], [], tokens]
  );

export const tokenize = (characters: string): Token[] => {
  const allTokens = getAllTokens(characters);
  return rollupIrrelevant(allTokens);
};

const tokenizeStream = () => {};
