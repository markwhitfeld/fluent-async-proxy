import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FluentPromise, Wrapped } from '../src/fluent-async.types';
import { getProxiedFunc, unWrap, wrap, createFluentPromise, wrapMap, unWrapMap } from '../src/fluent-async';

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

wrapMap.set(rootObject, wrapper);
unWrapMap.set(wrapper, rootObject);

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
