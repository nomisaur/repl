const isLetter = () => {
  /[a-zA-Z]/;
};

// [
//   {
//     token: "symbol",
//     value: "let",
//   },
//   {
//     token: "symbol",
//     value: "fib",
//   },
//   {
//     token: "=",
//   },
//   {
//     token: "(",
//   },
//   {
//     token: "symbol",
//     value: "n",
//   },
//   {
//     token: ")",
//   },
//   {
//     token: "->",
//   },
// ];

// [
//   {
//     type: "assign",
//     symbol: "fib",
//     value: {
//       type: "function",
//       params: [{ type: "symbol", value: "n" }],
//       body:
//     },
//   },
// ];

// let fib = (n) -> {
//   if n == 0 || n == 1
//     then ((+) (fib n - 1) (fib n - 2))
// }

const tokenize = (exp) => {};

const analyze = (exp) => {};

module.exports = {
  analyze,
};
