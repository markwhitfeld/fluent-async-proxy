export type Promised<T> = T extends Promise<infer V> ? V : T;
export type AnyFunc = (this: unknown, ...args: unknown[]) => unknown;

export type Wrapped<T> = {
  [K in keyof T]: WrappedValue<T[K]>;
};

type WrappedValue<T> = T extends Promise<infer V>
  ? FluentPromise<V>
  : T extends AnyFunc
  ? WrappedFunc<T>
  : T extends object
  ? Wrapped<T>
  : T;

export type WrappedFunc<T extends AnyFunc> = T extends (
  ...args: infer TArgs
) => infer TReturn
  ? TReturn extends Promise<infer V>
    ? (...args: TArgs) => FluentPromise<V>
    : (...args: TArgs) => Wrapped<TReturn>
  : never;

export type AsyncWrapped<T> = {
  [K in keyof T]: T[K] extends Promise<infer V>
    ? FluentPromise<V>
    : T[K] extends AnyFunc
    ? PromisedFunc<T[K]>
    : FluentPromise<T[K]>;
};
export type FluentPromise<T> = AsyncWrapped<T> & Promise<Wrapped<T>>;

export type PromisedFunc<T extends AnyFunc> = (T extends (
  ...args: infer TArgs
) => infer TReturn
  ? (...args: TArgs) => FluentPromise<Promised<TReturn>>
  : never) &
  Promise<Wrapped<T>>;
