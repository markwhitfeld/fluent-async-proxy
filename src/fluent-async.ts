import {
  AnyFunc,
  WrappedFunc,
  FluentPromise,
  Wrapped,
  PromisedFunc,
  AsyncWrapped,
  Promised,
} from "./fluent-async.types";
import { withValue } from "./withValue";

function createProxiedFunc<T extends AnyFunc | Promise<AnyFunc>>(
  fn: T
): WrappedFunc<Promised<T>> {
  function proxiedFunc() {
    const thisRef = this;
    const args = arguments;
    const result = withValue(fn, (val) => {
      const originalFn = val;
      return withValue(thisRef, (ref) => {
        const target = unWrap(ref);
        return Reflect.apply(originalFn, target, args);
      });
    });
    if (result instanceof Promise) {
      return createFluentPromise(result);
    }
    return wrap(result);
  }
  return proxiedFunc as unknown as WrappedFunc<Promised<T>>;
}

export function getProxiedFunc<T extends AnyFunc>(
  originalFn: T
): WrappedFunc<Promised<T>> {
  const existing = wrapMap.get(originalFn);
  if (existing) {
    return existing;
  }
  const proxiedFunc = createProxiedFunc(originalFn);
  wrapMap.set(originalFn, proxiedFunc);
  return proxiedFunc;
}

function createPromisedFunc<TFunc extends AnyFunc>(
  result: Promise<TFunc>
): PromisedFunc<TFunc> {
  const wrappedResult = result.then((val) => wrap(val));
  const proxiedFunc = createProxiedFunc(result);
  return Object.assign(
    proxiedFunc as unknown as PromisedFunc<TFunc>,
    wrappedResult
  );
}

export function createFluentPromise<T>( /// TBD address this removal: extends object>(
  result: Promise<T>
): FluentPromise<T> {
  // const wrappedResult = new Promise<T>((resolve, reject) => result.then((val) => resolve(wrap(val))).catch(reject));
  const wrappedResult = result.then((val) => wrap(val as object));
  const resultProxy = createAsyncProxy(result as Promise<object>);
  return Object.assign(wrappedResult, resultProxy) as FluentPromise<T>;
}


export function get<T extends object, Key extends keyof T>(target: T | Promise<T>, p: Key, receiver: any): any {  
  const result = withValue(target, (ref) => {
    const thisRef = ref; // TBD unWrap(ref);
    return Reflect.get(thisRef as T, p, thisRef);
  });
  // if it is a promise then we need a proxy
  // we need a proxy that can handle the call to `apply` for the func, and then we know it is a function
  // we need a proxy that can handle the prop calls, and treat it as an object
  if (result instanceof Promise) {
    return createFluentPromise(result as Promise<T[Key]>);
  }
  // if it is not a promise then we can return the value (wrapped if object | proxfunc if function, not if string | number | boolean)
  if (result instanceof Function) {
    return getProxiedFunc(result as AnyFunc);
  }
  if (result instanceof Object) {
    return wrap(result);
  }
  return result;  
}

function createAsyncProxy<T extends object>(result: Promise<T>) {

  new Proxy(result, {});


  return {
    __brand: "ResultProxy",
    get thisFunc() {
      //rootObject.thisFunc;
      const thisRef = result; // TBD receiver || target
      const promisedFunc = withValue(thisRef, (ref) => {
        const target = ref; // TBD unWrap(ref);
        const innerResult = Reflect.get(target, "thisFunc", target) as unknown as () => T;
        return innerResult;
      });
      // because in design we know it is a function, we create a promised function
      // but at this point in execution we only have a promise.
      // we need a proxy that can handle the call to `apply` for the func, and then we know it is a function
      return createPromisedFunc(promisedFunc);
      // if it is not a promise then we can return the value (wrapped if object | proxfunc if function, not if string | number | boolean)
    },
    get hello() {
      const thisRef = result; // TBD receiver || target
      const result2 = withValue(thisRef, (ref) => {
        const target = ref; // TBD unWrap(ref);
        return Reflect.get(target, "hello");
      });
      // because in design we know it is a string, we create a promised string
      // but at this point in execution we only have a promise.
      // we need a proxy that can handle the prop calls, and treat it as an object
      return createStringPromise(result2);
      // if it is not a promise then we can return the value (wrapped if object | function, not if string | number | boolean)
    },
    get asyncThisFunc() {
      //rootObject.asyncThisFunc;
      const thisRef = result; // TBD receiver || target
      const promisedFunc = withValue(thisRef, (ref) => {
        const target = ref; // TBD unWrap(ref);
        const innerResult = Reflect.get(target, "asyncThisFunc", target);
        return innerResult;
      });
      // because in design we know it is a function, we create a promised function
      // but at this point in execution we only have a promise.
      // we need a proxy that can handle the call to `apply` for the func, and then we know it is a function
      // in the apply, we need to return a proxied function
      return createPromisedFunc(promisedFunc);
      // if it is not a promise then we can return a proxied function (for functions) or a promise (for objects)
    },
  } as unknown as AsyncWrapped<T>;
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
export const wrapMap = new WeakMap();
export const unWrapMap = new WeakMap();

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
