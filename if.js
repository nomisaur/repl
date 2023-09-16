const evalIf = (exp, env) => {
  return isTrue(eval(predicate(exp), env))
    ? eval(consequent(exp), evn)
    : eval(alternative(exp), env);
};
