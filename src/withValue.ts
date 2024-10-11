import { Promised } from "./fluent-async.types";

/**
 * This function takes a value and a callback function. If the value is a Promise,
 * it waits for the Promise to resolve and then calls the callback function with the
 * resolved value. If the value is not a Promise, it calls the callback function with
 * the value immediately.
 *
 * @param value The value or promise to extract the value from.
 * @param callback The function that will be called with the value extracted from the promise.
 * @returns The result of calling the callback function with the extracted value. If the value is a Promise, the result will also be a Promise.
 */
export function withValue<TValue, TParam extends Promised<TValue>, TResult>(
  value: TValue,
  callback: (val: TParam) => TResult
): TValue extends Promise<unknown> ? Promise<TResult> : TResult {
  type TReturn = ReturnType<typeof withValue<TValue, TParam, TResult>>;
  if (value instanceof Promise) {
    return value.then(callback) as TReturn;
  } else {
    return callback(value as unknown as TParam) as TReturn;
  }
}
