// const fs = require("fs");
// const { parse } = require("./src/parser");
// const { log } = require("./src/utils");

import fs from "fs";
import { parse } from "./src/parser";
import { log } from "./src/utils";

const test = fs.readFileSync("./test.txt", { encoding: "utf8", flag: "r" });

log("parse: ", parse(test));

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
