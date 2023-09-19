// const fs = require("fs");
// const { parse } = require("./src/parser");
// const { log } = require("./src/utils");

import fs from "fs";
import { parse } from "./parser";
import { tokenize, getNextToken } from "./tokenizer";
import { inspect, log } from "./utils";
import { evaluate } from "./evaluator";

const test = fs.readFileSync("./test.txt", { encoding: "utf8", flag: "r" });

console.log(evaluate(test));

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
