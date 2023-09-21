"use strict";
// const fs = require("fs");
// const { parse } = require("./src/parser");
// const { log } = require("./src/utils");
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const evaluator_1 = require("./evaluator");
const test = fs_1.default.readFileSync("./test.txt", { encoding: "utf8", flag: "r" });
console.log("> ", (0, evaluator_1.evaluate)(test));
// async function logChunks(readable) {
//   let ok = [];
//   for await (const chunk of readable) {
//     ok.push(chunk);
//   }
//   console.log(ok);
// }
// const readable = fs.createReadStream("./src/tokenizer.js", {
//   encoding: "utf8",
// });
// logChunks(readable);
