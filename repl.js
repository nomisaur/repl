const prompt = require("prompt-sync")({ sigint: true });

const { evaluate } = require("./eval");

const makeEnvironment = (variables, parent) => {
  const environment = {
    parent,
    variables,
  };

  const extend = (vars) => makeEnvironment(vars, environment);

  const lookup = (key) =>
    environment.variables[key] ?? parent ? parent.lookup(key) : null;

  const set = (key, val) => (variables[key] = val);

  return {
    ...environment,
    extend,
    lookup,
    set,
  };
};

const repl = () => {
  while (true) {
    const expression = prompt("> ");
    if (expression == "q") {
      return;
    }
    const result = evaluate(expression, makeEnvironment({}, null));
    console.log(result);
  }
};

module.exports = {
  repl,
};
