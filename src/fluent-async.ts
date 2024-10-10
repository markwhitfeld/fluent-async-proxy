import {
  AnyFunc,
  WrappedFunc,
  FluentPromise,
  Wrapped,
  PromisedFunc,
  AsyncWrapped,
} from "./fluent-async.types";
import {
  RootObject,
  WrapperType,
  rootObject,
  wrapper,
} from "../test/basic.test";

export function getProxiedFunc<T extends AnyFunc>(
  originalFn: T
): WrappedFunc<T> {
  const existing = wrapMap.get(originalFn);
  if (existing) {
    return existing;
  }
  function proxiedFunc() {
    const thisRef = this;
    const args = arguments;
    const target = unWrap(thisRef);
    const innerResult = Reflect.apply(originalFn, target, args);
    // console.dir({ innerResult });
    if (innerResult instanceof Promise) {
      return createFluentPromise(innerResult);
    }
    return wrap(innerResult);
  }
  wrapMap.set(originalFn, proxiedFunc);
  return proxiedFunc as unknown as WrappedFunc<T>;
}

function createPromisedFunc<TFunc extends AnyFunc>(
  result: Promise<TFunc>
): PromisedFunc<TFunc> {
  type TReturn = ReturnType<TFunc>;
  const wrappedResult = result.then((val) => wrap(val));
  function proxiedFunc() {
    const thisRef = this;
    const args = arguments;
    const result2 = result.then((val) => {
      // typeof originalFn === 'function'
      const originalFn = val;
      /* return unWrap(thisRef).then((target) => {
        const innerResult: TReturn = Reflect.apply(originalFn, target, args);
        return innerResult;
      });*/
      return thisRef.then((ref) => {
        const target = unWrap(ref);
        const innerResult: TReturn = Reflect.apply(originalFn, target, args);
        return innerResult;
      });
      const target = unWrap(thisRef);
      const innerResult: TReturn = Reflect.apply(originalFn, target, args);
      return innerResult;
    });
    return createFluentPromise(
      result2 as unknown as Promise<Wrapped<RootObject>>
    );
  }
  return Object.assign(
    proxiedFunc as unknown as PromisedFunc<TFunc>,
    wrappedResult
  );
}
export function createFluentPromise<T extends WrapperType>(
  result: Promise<T>
): FluentPromise<T> {
  // const wrappedResult = new Promise<T>((resolve, reject) => result.then((val) => resolve(wrap(val))).catch(reject));
  const wrappedResult = result.then((val) => wrap(val));
  const resultProxy = {
    __brand: "ResultProxy",
    get thisFunc() {
      //rootObject.thisFunc;
      const promisedFunc = result.then((val) => {
        const innerResult = Reflect.get(
          val,
          "thisFunc",
          val
        ) as unknown as () => T;
        return innerResult;
      });
      return createPromisedFunc(promisedFunc);
    },
    get hello() {
      const result2 = result.then((val) => {
        const innerResult: string = Reflect.get(val, "hello", val);
        return innerResult;
      });
      return createStringPromise(result2);
    },
    get asyncThisFunc() {
      //rootObject.asyncThisFunc;
      const promisedFunc = result.then((val) => {
        const innerResult = Reflect.get(val, "asyncThisFunc", val);
        return innerResult;
      });
      return createPromisedFunc(promisedFunc);
    },
  } as unknown as AsyncWrapped<T>;
  return Object.assign(wrappedResult, resultProxy);
}
function createStringPromise<T extends string>(
  result: Promise<T>
): FluentPromise<T> {
  // const wrappedResult = new Promise<T>((resolve, reject) => result.then((val) => resolve(wrap(val))).catch(reject));
  const wrappedResult = result.then((val) => val);
  const resultProxy = {};
  return Object.assign(
    wrappedResult,
    resultProxy
  ) as unknown as FluentPromise<T>;
}
const wrapMap = new WeakMap();
wrapMap.set(rootObject, wrapper);
const unWrapMap = new WeakMap();
unWrapMap.set(wrapper, rootObject);
export function wrap<T extends object>(value: T): Wrapped<T> {
  const existing = wrapMap.get(value);
  if (existing) {
    return existing;
  }
  console.dir(value);
  throw new Error("implement general wrapper");
}
export function unWrap<T extends object>(value: Wrapped<T>): Promise<T> {
  const existing = unWrapMap.get(value);
  if (existing) {
    return existing;
  }
  console.dir(value);
  throw new Error("implement general unwrapper");
}
