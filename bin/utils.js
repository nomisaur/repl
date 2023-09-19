"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loop = exports.toObject = exports.debug = exports.log = exports.inspect = void 0;
// const util = require("util");
const util_1 = __importDefault(require("util"));
const inspect = (obj) => util_1.default.inspect(obj, { showHidden: false, depth: null, colors: true });
exports.inspect = inspect;
const log = (tag, obj) => console.log(tag, ...(obj
    ? [util_1.default.inspect(obj, { showHidden: false, depth: null, colors: true })]
    : []));
exports.log = log;
const debug = (func) => (...args) => {
    (0, exports.log)(func.name + " inputs:", args);
    const result = func(args);
    (0, exports.log)(func.name + " output: ", result);
    return result;
};
exports.debug = debug;
exports.debug.on = true;
const toObject = (array, transform = (key) => ({
    [key]: true,
})) => {
    return array.reduce((acc, ...rest) => ({ ...acc, ...transform(...rest) }), {});
};
exports.toObject = toObject;
// const m = (f) => f(f);
const m = (f, ...args) => f(f, ...args);
// export const y = (func) =>
//   m((mFunc) => func((...args) => mFunc(mFunc)(...args)));
const loop = (func, ...args) => m((mFunc, ...inner) => func((...args) => mFunc(mFunc, ...args), ...inner), ...args);
exports.loop = loop;
// export const loop1 = (func, ...args) => y(func)(...args);
// export const loop = (func, ...args) =>
//   m((mFunc, ...args) => mFunc(mFunc, ...args))(...args);
// export const loop = (func) =>
//   m((mFunc) => func((...args) => mFunc(mFunc, ...args)));
