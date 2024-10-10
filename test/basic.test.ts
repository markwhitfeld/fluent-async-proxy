import httpjs from '../httpJS/test-httpjs.umd.cjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

interface RootObject {
  hello: string;
  thisFunc(): RootObject;
  asyncThisFunc(): Promise<RootObject>;
}

const rootObject: RootObject = {
  hello: 'world',
  thisFunc() {
    return this;
  },
  async asyncThisFunc() {
    return this;
  },
  /*
  undefinedProp: undefined,
  get child() {
    return { child: true };
  },
  childFunc() {
    return { child: true };
  },
  async asyncChildFunc() {
    return { child: true };
  },
  */
};

function getProxiedFunc<T extends AnyFunc>(originalFn: T): WrappedFunc<T> {
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

const wrapper: WrapperType = {
  get hello() {
    return rootObject.hello;
  },
  get thisFunc() {
    const originalFn = Reflect.get(rootObject, 'thisFunc', this);
    return getProxiedFunc(originalFn);
    function proxiedFunc() {
      const thisRef = this;
      const args = arguments;
      const target = unWrap(thisRef);
      const innerResult = Reflect.apply(originalFn, target, args);
      // console.dir({ innerResult });
      return wrap(innerResult);
    }
    return proxiedFunc;
    return rootObject.thisFunc;
  },
  get asyncThisFunc() {
    //rootObject.asyncThisFunc;
    const originalFn = Reflect.get(rootObject, 'asyncThisFunc', this);
    return getProxiedFunc(originalFn);
    function proxiedFunc() {
      const thisRef = this;
      const args = arguments;
      const target = unWrap(thisRef);
      const innerResult = Reflect.apply(originalFn, target, args);
      return createFluentPromise(innerResult) as FluentPromise<RootObject>;
    }
    return proxiedFunc;
    //rootObject.thisFunc;
    /*
      const promisedFunc = result.then(val => {
        const innerResult = Reflect.get(val, 'asyncThisFunc', val);
        return innerResult;
      });
      return createPromisedFunc(promisedFunc);
      */

    /*
    return function wrapped() {
      const originalFn = rootObject.asyncThisFunc;
      const result: Promise<WrapperType> = Reflect.apply(originalFn, rootObject, arguments);
      // result is promise
      const wrappedResult = new Promise<typeof wrapper>((resolve, reject) => result.then((val) => resolve(wrap(val))).catch(reject)) as unknown as Promise<WrapperType> & Mutable<WrapperType>;
      wrappedResult.thisFunc = function wrappedThisFunc() {
          //rootObject.thisFunc;
          const args = arguments;
          const result2: Promise<WrapperType> = result.then(val => {          
            const originalFn = val.thisFunc;
            const innerResult = Reflect.apply(originalFn, val, args);
            return innerResult;
          });
          return createFluentPromise(result2);
        }

      wrappedResult.asyncThisFunc = function wrapped() {
        const args = arguments;
        const result2: Promise<WrapperType> = result.then(val => {          
          const originalFn = val.asyncThisFunc;
          const innerResult = Reflect.apply(originalFn, val, args);
          return innerResult;
        });
        // result is promise
        const wrappedResult = new Promise<typeof wrapper>(result.then) as unknown as Promise<WrapperType> & Mutable<WrapperType>;
        wrappedResult.thisFunc = rootObject.thisFunc;
        wrappedResult.asyncThisFunc = 
        return result;
      };
      return wrappedResult as unknown as Promise<WrapperType> & WrapperType;
    }; */
  },
};

type WrapperType = Wrapped<RootObject>;

type Wrapped<T> = {
  [K in keyof T]: WrappedValue<T[K]>;
};

type WrappedValue<T> = T extends Promise<infer V>
  ? FluentPromise<V>
  : T extends AnyFunc
  ? WrappedFunc<T>
  : T extends object
  ? Wrapped<T>
  : T;

type WrappedFunc<T extends AnyFunc> = T extends (
  ...args: infer TArgs
) => infer TReturn
  ? TReturn extends Promise<infer V>
    ? (...args: TArgs) => FluentPromise<V>
    : (...args: TArgs) => Wrapped<TReturn>
  : never;

type AsyncWrapped<T> = {
  [K in keyof T]: T[K] extends Promise<infer V>
    ? FluentPromise<V>
    : T[K] extends AnyFunc
    ? PromisedFunc<T[K]>
    : FluentPromise<T[K]>;
};

type FluentPromise<T> = AsyncWrapped<T> & Promise<Wrapped<T>>;

type Promised<T> = T extends Promise<infer V> ? V : T;

type AnyFunc = (this: unknown, ...args: unknown[]) => unknown;

type PromisedFunc<T extends AnyFunc> = (T extends (
  ...args: infer TArgs
) => infer TReturn
  ? (...args: TArgs) => FluentPromise<Promised<TReturn>>
  : never) &
  Promise<Wrapped<T>>;

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

function createFluentPromise<T extends WrapperType>(
  result: Promise<T>
): FluentPromise<T> {
  // const wrappedResult = new Promise<T>((resolve, reject) => result.then((val) => resolve(wrap(val))).catch(reject));
  const wrappedResult = result.then((val) => wrap(val));
  const resultProxy = {
    __brand: 'ResultProxy',
    get thisFunc() {
      //rootObject.thisFunc;
      const promisedFunc = result.then((val) => {
        const innerResult = Reflect.get(
          val,
          'thisFunc',
          val
        ) as unknown as () => T;
        return innerResult;
      });
      return createPromisedFunc(promisedFunc);
    },
    get hello() {
      const result2 = result.then((val) => {
        const innerResult: string = Reflect.get(val, 'hello', val);
        return innerResult;
      });
      return createStringPromise(result2);
    },
    get asyncThisFunc() {
      //rootObject.asyncThisFunc;
      const promisedFunc = result.then((val) => {
        const innerResult = Reflect.get(val, 'asyncThisFunc', val);
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

function wrap<T extends object>(value: T): Wrapped<T> {
  const existing = wrapMap.get(value);
  if (existing) {
    return existing;
  }
  console.dir(value);
  throw new Error('implement general wrapper');
}

function unWrap<T extends object>(value: Wrapped<T>): Promise<T> {
  const existing = unWrapMap.get(value);
  if (existing) {
    return existing;
  }
  console.dir(value);
  throw new Error('implement general unwrapper');
}

describe('tests', () => {
  it(`thisFunc() returns wrapper`, async () => {
    expect(wrapper.thisFunc()).toBe(wrapper);
  });
  it(`thisFunc().thisFunc() returns wrapper`, async () => {
    expect(wrapper.thisFunc().thisFunc()).toBe(wrapper);
  });
  it(`awaited asyncThisFunc() returns wrapper`, async () => {
    expect(await wrapper.asyncThisFunc()).toBe(wrapper);
  });
  it(`non awaited asyncThisFunc() returns PromiseWrapper`, async () => {
    expect(wrapper.asyncThisFunc()['__brand']).toBe('ResultProxy');
  });
  it(`awaited asyncThisFunc().asyncThisFunc() returns wrapper`, async () => {
    const actual = await wrapper.asyncThisFunc().asyncThisFunc();
    expect(actual).toBe(wrapper);
  });
});
