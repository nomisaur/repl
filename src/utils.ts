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

const m = (f) => f(f);

export const y = (func) =>
  m((mFunc) => func((...args) => mFunc(mFunc)(...args)));
