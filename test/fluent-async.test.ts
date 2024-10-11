import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { wrap } from "../src/fluent-async";

interface RootObject {
  __brand: "RootObject";
  hello: string;
  thisFunc(): RootObject;
  asyncThisFunc(): Promise<RootObject>;
  child: ChildObject;
  childFunc(): ChildObject;
  asyncChildFunc(): Promise<ChildObject>;
}

interface ChildObject {
  foo: string;
  getRoot(): RootObject;
  asyncGetRoot(): Promise<RootObject>;
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
    get child() {
      return childObject;
    },
    childFunc() {
      return childObject;
    },
    async asyncChildFunc() {
      return childObject;
    },
  };
  const childObject: ChildObject = {
    foo: "bar",
    async asyncGetRoot() {
      return rootObject;
    },
    getRoot() {
      return rootObject;
    },
  };
  const wrapper = wrap(rootObject);
  return { rootObject, childObject, wrapper };
}

describe("tests", () => {
  it(`.hello returns string`, async () => {
    const { rootObject, wrapper } = setupTest();
    expect(wrapper.hello).toEqual("world");
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
    expect(actual).toEqual("world");
  });
  it(`awaited .thisFunc().hello returns string`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = wrapper.thisFunc().hello;
    expect(await actual).toEqual("world");
  });
  it(`awaited asyncThisFunc() returns wrapper`, async () => {
    const { rootObject, wrapper } = setupTest();
    expect(await wrapper.asyncThisFunc()).toBe(wrapper);
  });
  it(`non awaited asyncThisFunc() returns ResultProxy`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = wrapper.asyncThisFunc();
    expect(actual["__brand"]).toEqual("ResultProxy");
  });
  it(`non awaited asyncThisFunc().hello returns ResultProxy`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = wrapper.asyncThisFunc().hello;
    expect(actual["__brand"]).toEqual("ResultProxy");
  });
  it(`awaited asyncThisFunc().hello returns string`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = await wrapper.asyncThisFunc().hello;
    expect(actual).toEqual("world");
  });
  it(`awaited asyncThisFunc().hello should not have 'then'`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = await wrapper.asyncThisFunc().hello;
    expect(actual).not.toHaveProperty("then");
  });
  it(`non awaited asyncThisFunc().asyncThisFunc returns ResultProxy`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = wrapper.asyncThisFunc().asyncThisFunc;
    expect(actual["__brand"]).toEqual("ResultProxy");
  });
  it(`non awaited asyncThisFunc().asyncThisFunc() returns ResultProxy`, async () => {
    const { rootObject, wrapper } = setupTest();
    const step = wrapper.asyncThisFunc();
    const actual = step.asyncThisFunc();
    expect(actual["__brand"]).toEqual("ResultProxy");
  });
  it(`awaited asyncThisFunc().asyncThisFunc() returns wrapper`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = await wrapper.asyncThisFunc().asyncThisFunc();
    expect(actual).toBe(wrapper);
  });
  describe(`.child`, () => {
    it(`returns ResultProxy`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.child;
      expect(actual["__brand"]).toEqual("ResultProxy");
    });
    it(`.foo [not awaited] returns string`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.child.foo;
      expect(actual).toEqual("bar");
    });
    it(`.getRoot() returns wrapper`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.child.getRoot();
      expect(actual).toBe(wrapper);
    });
    it(`.asyncGetRoot() returns ResultProxy`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.child.getRoot();
      expect(actual["__brand"]).toEqual("ResultProxy");
      expect(actual).toBe(wrapper);
    });
    it(`.asyncGetRoot() [awaited] returns wrapper`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = await wrapper.child.getRoot();
      expect(actual).toBe(wrapper);
    });
  });
  describe(`.childFunc()`, () => {
    it(`is a ProxiedFunc`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.childFunc;
      expect(actual.name).toEqual("proxiedFunc");
    });
    it(` returns ResultProxy`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.childFunc();
      expect(actual["__brand"]).toEqual("ResultProxy");
    });
    it(`.foo [not awaited] returns string`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.childFunc().foo;
      expect(actual).toEqual("bar");
    });
    it(`.getRoot() returns wrapper`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.childFunc().getRoot();
      expect(actual).toBe(wrapper);
    });
    it(`.asyncGetRoot() returns ResultProxy`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.childFunc().getRoot();
      expect(actual["__brand"]).toEqual("ResultProxy");
      expect(actual).toBe(wrapper);
    });
    it(`.asyncGetRoot() [awaited] returns wrapper`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = await wrapper.childFunc().asyncGetRoot();
      expect(actual).toBe(wrapper);
    });
  });
  describe(`.asyncChildFunc()`, () => {
    it(`is a ProxiedFunc`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.asyncChildFunc;
      expect(actual.name).toEqual("proxiedFunc");
    });
    it(`returns ResultProxy`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.asyncChildFunc();
      expect(actual["__brand"]).toEqual("ResultProxy");
    });
    it(`.foo [not awaited] returns ResultProxy`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.asyncChildFunc().foo;
      expect(actual["__brand"]).toEqual("ResultProxy");
    });
    it(`.foo [awaited] returns a string`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = await wrapper.asyncChildFunc().foo;
      expect(actual).toEqual("bar");
    });
    it(`.getRoot() [not awaited] returns ResultProxy`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.asyncChildFunc().getRoot();
      expect(actual["__brand"]).toEqual("ResultProxy");
    });
    it(`.getRoot() [awaited] returns wrapper`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = await wrapper.asyncChildFunc().getRoot();
      expect(actual).toBe(wrapper);
    });
    it(`.asyncGetRoot() [not awaited] returns ResultProxy`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = wrapper.asyncChildFunc().asyncGetRoot();
      expect(actual["__brand"]).toEqual("ResultProxy");
    });
    it(`.asyncGetRoot() [awaited] returns wrapper`, async () => {
      const { rootObject, wrapper } = setupTest();
      const actual = await wrapper.asyncChildFunc().asyncGetRoot();
      expect(actual).toBe(wrapper);
    });
  });
  it(`.childFunc().foo [not awaited] returns string`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = wrapper.childFunc().foo;
    expect(actual).toEqual("bar");
  });
  it(`.thisFunc().thisFunc() returns wrapper`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = wrapper.thisFunc().thisFunc();
    expect(actual).toBe(wrapper);
  });
  it(`.thisFunc().hello returns string`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = wrapper.thisFunc().hello;
    expect(actual).toEqual("world");
  });
  it(`awaited .thisFunc().hello returns string`, async () => {
    const { rootObject, wrapper } = setupTest();
    const actual = wrapper.thisFunc().hello;
    expect(await actual).toEqual("world");
  });
});
