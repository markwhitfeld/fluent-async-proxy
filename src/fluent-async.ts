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

function getPromisedFunc<TFunc extends AnyFunc>(
  result: Promise<TFunc>
): PromisedFunc<TFunc> {
  const existing = wrapMap.get(result);
  if (existing) {
    return existing;
  }
  const wrappedResult = result.then((val) => wrap(val));
  const proxiedFunc = createProxiedFunc(result);
  wrapMap.set(result, proxiedFunc);
  return Object.assign(
    proxiedFunc as unknown as PromisedFunc<TFunc>,
    wrappedResult
  );
}

export function createFluentPromise<T>(result: Promise<T>): FluentPromise<T> {  
  const wrappedResult = result.then((val) => wrap(val as object));
  return createAsyncProxy(
    result as Promise<object>,
    wrappedResult
  ) as FluentPromise<T>;
}

export function get<T extends object, Key extends keyof T>(
  target: T | Promise<T>,
  p: Key,
  receiver: any
): any {
  const result = withValue(target, (ref) => {
    const thisRef = ref;
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

function createAsyncProxy<T extends object>(
  result: T | Promise<T>,
  wrappedResult?: Promise<object>
) {
  const wrappedPromiseFns = wrappedResult && {
        then: wrappedResult.then.bind(wrappedResult),
        catch: wrappedResult.catch.bind(wrappedResult),
        finally: wrappedResult.finally.bind(wrappedResult),
      };
  const proxyTarget = () => ({
    result,
    wrappedPromiseFns,
  });
  // The target must be a function to allow for execution of a lazy function
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/apply#invariants
  const proxy = new Proxy(proxyTarget, {
    get(target, p, receiver) {
      if (p === "__brand") return "ResultProxy";
      if (wrappedPromiseFns && (p === "then" || p === "catch" || p === "finally")) {
        return wrappedPromiseFns[p];
      }
      return get(result, p, receiver);
    },
    apply(target, thisArg, argArray) {
      // We now know that this async property is being used as a function,
      //  so we can create the function proxy.
      const promisedFunc = getPromisedFunc(result as Promise<AnyFunc>);
      return Reflect.apply(promisedFunc, thisArg, argArray);
    },
  }) as unknown as FluentPromise<T>;
  wrappedResult && Object.setPrototypeOf(proxy, wrappedResult);
  return proxy;
}

export const wrapMap = new WeakMap();
export const unWrapMap = new WeakMap();

export function wrap<T extends object>(value: T): Wrapped<T> {
  if (typeof value !== "object") {
    return value as Wrapped<T>;
  }
  const existing = wrapMap.get(value);
  if (existing) {
    return existing;
  }
  const proxy = createAsyncProxy(value) as Wrapped<T>;
  wrapMap.set(value, proxy);
  unWrapMap.set(proxy, value);
  return proxy;
}

export function unWrap<T extends object>(value: Wrapped<T>): Promise<T> {
  const existing = unWrapMap.get(value);
  if (existing) {
    return existing;
  }
  console.dir(value);
  throw new Error("implement general unwrapper");
}
