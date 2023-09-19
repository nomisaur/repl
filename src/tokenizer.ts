import { loop } from "./utils";

import { lexRegex, ignoredRegex } from "./syntax";

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

const wordRegex = /^[A-Za-z_?]\w*/g;

const whitespaceRegex = /^\s+/g;

const commentRegex = /(^~{(.|\n)*}~)|(^~.*((?=\n)|$))/g;

const matcher = (type, chars, regex): [RawToken, string] | null => {
  const result = chars.match(regex);
  if (result) {
    const [value] = result;
    return [{ type, value, isToken: true }, chars.slice(value.length)];
  }
  return null;
};

export const getNextRawToken = (characters): [RawToken, string] => {
  const ignored = matcher("ignored", characters, ignoredRegex);
  if (ignored) return ignored;
  const syntax = matcher("lex", characters, lexRegex);
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

export const getNextToken = (characters): [Token, string] =>
  loop(
    (next, irrelevant, chars) => {
      if (chars === "") {
        return [{ type: "end", value: "", irrelevant, isToken: true }, ""];
      }
      const [rawToken, rest] = getNextRawToken(chars);
      if (
        rawToken.type === "whitespace" ||
        rawToken.type === "ignored" ||
        rawToken.type === "comment"
      ) {
        return next([...irrelevant, rawToken], rest);
      }
      return [{ ...rawToken, irrelevant }, rest];
    },
    [],
    characters
  );

const getAllTokens = (characters: string): Token[] =>
  loop(
    (next, acc, rest) => {
      const [token, leftovers] = getNextToken(rest);
      if (token.type === "end") return [...acc, token];
      return next([...acc, token], leftovers);
    },
    [],
    characters
  );

export const tokenize = (characters: string): Token[] => {
  const tokens = getAllTokens(characters);
  console.log("tokens:", tokens);
  return tokens;
};
