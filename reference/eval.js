// const isNumber = (exp) => {
//   return !isNaN(exp);
// };

// const isString = (exp) => {
//   return typeof exp === "string";
// };

// const isSelfEvaluating = (exp) => {
//   return isNumber(exp) || isString(exp);
// };

const evaluate = (exp, env) => {
  const ast = analyze(exp);
  if (isSelfEvaluating(exp)) {
    return exp;
  }
  throw Error("Eval error, unknown expression", exp);
};

module.exports = { evaluate };
