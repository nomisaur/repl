// const util = require("util");
import util from "util";

export const log = (tag: string, obj) =>
  console.log(
    tag,
    util.inspect(obj, { showHidden: false, depth: null, colors: true })
  );

export const debug = (tag: string, obj) => debug.on && log(tag, obj);
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
