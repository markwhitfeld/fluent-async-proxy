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
  },
  get asyncThisFunc() {
    const originalFn = Reflect.get(rootObject, 'asyncThisFunc', this);
    return getProxiedFunc(originalFn);    
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
