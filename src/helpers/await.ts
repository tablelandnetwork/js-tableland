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
): AbortSignal {
  let abortSignal: AbortSignal;
  if (signal == null) {
    const controller = new AbortController();
    abortSignal = controller.signal;
    setTimeout(controller.abort.bind(controller), maxTimeout);
  } else {
    abortSignal = signal;
  }
  return abortSignal;
}

export async function getAsyncPoller<T = unknown>(
  fn: AsyncFunction<T>,
  interval: number = 1500,
  signal?: AbortSignal
): Promise<T> {
  const abortSignal = getAbortSignal(signal, 10_000);
  const checkCondition = (
    resolve: (value: T) => void,
    reject: (reason?: any) => void
  ): void => {
    Promise.resolve(fn())
      .then((result: AsyncData<T>) => {
        if (result.done && result.data != null) {
          return resolve(result.data);
        }
        if (abortSignal.aborted) {
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
