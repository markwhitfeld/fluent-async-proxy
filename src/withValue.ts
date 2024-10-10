export function withValue<T, TResult>(
  value: Promise<T>,
  callback: (val: T) => TResult
): Promise<TResult>;
export function withValue<T, TResult>(
  value: T,
  callback: (val: T) => TResult
): TResult;
export function withValue<TValue, TResult>(
  value: TValue,
  callback: (val: any) => TResult
) {
  if (value instanceof Promise) {
    return value.then(callback);
  } else {
    return callback(value);
  }
}
