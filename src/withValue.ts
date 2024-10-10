import { Promised } from "./fluent-async.types";

/*
export function withValue<T extends Promise<unknown>, TResult>(
  value: T,
  callback: (val: Awaited<T>) => TResult
): Promise<TResult>;
export function withValue<T, TResult>(
  value: T,
  callback: (val: T) => TResult
): TResult;
*/
export function withValue<TValue, TParam extends Promised<TValue>, TResult>(
  value: TValue,
  callback: (val: TParam) => TResult
) {
  if (value instanceof Promise) {
    return value.then(callback);
  } else {
    return callback(value as unknown as TParam);
  }
}
