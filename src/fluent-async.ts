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

export function createFluentPromise<T>( /// TBD address this removal: extends object>(
  result: Promise<T>
): FluentPromise<T> {
  const wrappedResult = result.then((val) => wrap(val as object));
  return createAsyncProxy(result as Promise<object>, wrappedResult)  as FluentPromise<T>;
}


export function get<T extends object, Key extends keyof T>(target: T | Promise<T>, p: Key, receiver: any): any {  
  const result = withValue(target, (ref) => {
    const thisRef = ref; // TBD? unWrap(ref);
    // if (typeof thisRef !== "object") {
    //   console.log("get", p, thisRef);
    //   throw new Error("not an object: " + thisRef + ' ' + String(p));      
    // }
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

function createAsyncProxy<T extends object>(result: T | Promise<T>, wrappedResult?: Promise<object>) {
  const proxyTarget = () => result;
  // The target must be a function to allow for execution of a lazy function
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/apply#invariants
  const proxy = new Proxy( proxyTarget, {
    get(target, p, receiver) {
      console.log("get", p);
      if (p === '__brand') return "ResultProxy";
      if (p === 'then' && wrappedResult) {
        return wrappedResult.then.bind(wrappedResult);
      }
      return get(result, p, receiver);
    },
    apply(target, thisArg, argArray) {
      console.log("apply");
      const promisedFunc = getPromisedFunc(result as Promise<AnyFunc>);
      wrapMap.set (result, promisedFunc);
      return Reflect.apply(promisedFunc, thisArg, argArray);
    },
    getPrototypeOf(target) {
      console.log("getPrototypeOf");
      return Reflect.getPrototypeOf(result);
    },
    ownKeys(target) {
      console.log("ownKeys");
      return Reflect.ownKeys(result);
    },
    construct(target, argArray, newTarget) {
      console.log("construct");
      return Reflect.construct(result, argArray, newTarget);
    },
    has(target, p) {
      console.log("has");
      return Reflect.has(result, p);
    },
    preventExtensions(target) {
      console.log("preventExtensions");
      return Reflect.preventExtensions(result);
    },
    getOwnPropertyDescriptor(target, p) {
      console.log("getOwnPropertyDescriptor");
      return Reflect.getOwnPropertyDescriptor(result, p);
    },


  }) as unknown as FluentPromise<T>;
  
  wrappedResult && Object.setPrototypeOf(proxy, wrappedResult);
  return proxy;
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

function wrapRootObject<T extends object>(rootObject: T) {
  const wrapper = {
    get hello() {
      return rootObject['hello'];
    },
    get thisFunc() {
      const originalFn = Reflect.get(rootObject, 'thisFunc', this);
      return getProxiedFunc(originalFn as any);    
    },
    get asyncThisFunc() {
      const originalFn = Reflect.get(rootObject, 'asyncThisFunc', this);
      return getProxiedFunc(originalFn as any);    
    },
  };
  wrapMap.set(rootObject, wrapper);
  unWrapMap.set(wrapper, rootObject);
  return wrapper;
}


export function wrap<T extends object>(value: T): Wrapped<T> {
  if (typeof value !== 'object') {
    return value as Wrapped<T>;
  }
  const existing = wrapMap.get(value);
  if (existing) {
    return existing;
  }
  if (value && value['__brand'] === 'RootObject') {
    // return wrapRootObject(value) as Wrapped<T>;
  }
  console.log("wrap", value);
  
  const proxy = createAsyncProxy(value) as Wrapped<T>;
  wrapMap.set(value, proxy);
  unWrapMap.set(proxy, value);
  return proxy;
  console.dir(value);
  throw new Error("implement general wrapper for " + value);
}

export function unWrap<T extends object>(value: Wrapped<T>): Promise<T> {
  const existing = unWrapMap.get(value);
  if (existing) {
    return existing;
  }
  console.dir(value);
  throw new Error("implement general unwrapper");
}
