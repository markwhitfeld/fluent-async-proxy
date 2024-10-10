import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FluentPromise, Wrapped } from "../src/fluent-async.types";
import {
  getProxiedFunc,
  unWrap,
  wrap,
  createFluentPromise,
  wrapMap,
  unWrapMap,
} from "../src/fluent-async";

interface RootObject {
  __brand: "RootObject";
  hello: string;
  thisFunc(): RootObject;
  asyncThisFunc(): Promise<RootObject>;
}

function setupTest() {
  const rootObject: RootObject = {
    __brand: "RootObject" as const,
    hello: "world",
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
  const wrapper = wrap(rootObject);
  return { rootObject, wrapper };
}

describe("tests", () => {
  it(`.hello returns string`, async () => {
    const { rootObject, wrapper } = setupTest();
    expect(wrapper.hello).toEqual('world');
  });
  it(`.thisFunc() returns wrapper`, async () => {
    const { rootObject, wrapper } = setupTest();
    expect(wrapper.thisFunc()).toBe(wrapper);
  });
  it(`.thisFunc().thisFunc() returns wrapper`, async () => {
    const { rootObject, wrapper } = setupTest();
    expect(wrapper.thisFunc().thisFunc()).toBe(wrapper);
  });
  it(`.thisFunc().hello returns string`, async () => {
    const { rootObject, wrapper } = setupTest();    
    const actual = wrapper.thisFunc().hello;
    expect(actual).toEqual('world');
  });
  it(`awaited .thisFunc().hello returns string`, async () => {
    const { rootObject, wrapper } = setupTest();    
    const actual = wrapper.thisFunc().hello;
    expect(await actual).toEqual('world');
  });
  it(`awaited asyncThisFunc() returns wrapper`, async () => {
    const { rootObject, wrapper } = setupTest();
    expect(await wrapper.asyncThisFunc()).toBe(wrapper);
  });
  it(`non awaited asyncThisFunc() returns PromiseWrapper`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = wrapper.asyncThisFunc();
    expect(actual["__brand"]).toBe("ResultProxy");
  });
  it.todo(`non awaited asyncThisFunc().hello returns PromiseWrapper`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = wrapper.asyncThisFunc().hello;
    expect(actual["__brand"]).toBe("ResultProxy");
  });
  it(`awaited asyncThisFunc().hello returns string`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = wrapper.asyncThisFunc().hello;    
    expect(await actual).toEqual('world');
  });
  it(`awaited asyncThisFunc().hello should not have 'then'`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = await wrapper.asyncThisFunc().hello;    
    expect(actual).not.toHaveProperty('then');
  });
  it(`awaited asyncThisFunc().asyncThisFunc() returns wrapper`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = await wrapper.asyncThisFunc().asyncThisFunc();
    expect(actual).toBe(wrapper);
  });
});
