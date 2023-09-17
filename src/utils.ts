// const util = require("util");
import util from "util";

export const inspect = (obj) =>
  util.inspect(obj, { showHidden: false, depth: null, colors: true });

export const log = (tag: string, obj?: object) =>
  console.log(
    tag,
    ...(obj
      ? [util.inspect(obj, { showHidden: false, depth: null, colors: true })]
      : [])
  );

export const debug =
  (func) =>
  (...args) => {
    log(func.name + " inputs:", args);
    const result = func(args);
    log(func.name + " output: ", result);
    return result;
  };
debug.on = true;

export const toObject = (
  array: any[],
  transform: (key: any, index: number, array: any[]) => object = (key) => ({
    [key]: true,
  })
) => {
  return array.reduce(
    (acc, ...rest) => ({ ...acc, ...transform(...rest) }),
    {}
  );
};

// const m = (f) => f(f);
const m = (f, ...args) => f(f, ...args);

// export const y = (func) =>
//   m((mFunc) => func((...args) => mFunc(mFunc)(...args)));

export const loop = (func, ...args) =>
  m(
    (mFunc, ...inner) => func((...args) => mFunc(mFunc, ...args), ...inner),
    ...args
  );

// export const loop1 = (func, ...args) => y(func)(...args);

// export const loop = (func, ...args) =>
//   m((mFunc, ...args) => mFunc(mFunc, ...args))(...args);

// export const loop = (func) =>
//   m((mFunc) => func((...args) => mFunc(mFunc, ...args)));
