export type Awaitable<T> = T | PromiseLike<T>;

export interface Signal {
  signal?: AbortSignal;
}

export interface Interval {
  interval?: number;
}

export type SignalAndInterval = Signal & Interval;

export interface Wait<T = unknown> {
  wait: (opts?: SignalAndInterval) => Promise<T>;
}

export interface AsyncData<T> {
  done: boolean;
  data?: T;
}

export type AsyncFunction<T> = () => Awaitable<AsyncData<T>>;

export function getAbortSignal(
  signal?: AbortSignal,
  maxTimeout: number = 60_000
): {
  signal: AbortSignal;
  timeoutId: ReturnType<typeof setTimeout> | undefined;
} {
  let abortSignal: AbortSignal;
  let timeoutId;
  if (signal == null) {
    const controller = new AbortController();
    abortSignal = controller.signal;
    // return the timeoutId so the caller can cleanup
    timeoutId = setTimeout(function () {
      controller.abort();
    }, maxTimeout);
  } else {
    abortSignal = signal;
  }
  return { signal: abortSignal, timeoutId };
}

export async function getAsyncPoller<T = unknown>(
  fn: AsyncFunction<T>,
  interval: number = 1500,
  signal?: AbortSignal
): Promise<T> {
  // in order to set a timeout other than 10 seconds you need to
  // create and pass in an abort signal with a different timeout
  const { signal: abortSignal, timeoutId } = getAbortSignal(signal, 10_000);
  const checkCondition = (
    resolve: (value: T) => void,
    reject: (reason?: any) => void
  ): void => {
    Promise.resolve(fn())
      .then((result: AsyncData<T>) => {
        if (result.done && result.data != null) {
          // We don't want to call `AbortController.abort()` if the call succeeded
          clearTimeout(timeoutId);
          return resolve(result.data);
        }
        if (abortSignal.aborted) {
          // We don't want to call `AbortController.abort()` if the call is already aborted
          clearTimeout(timeoutId);
          return reject(abortSignal.reason);
        } else {
          setTimeout(checkCondition, interval, resolve, reject);
        }
      })
      .catch((err) => {
        return reject(err);
      });
  };
  return await new Promise<T>(checkCondition);
}
