export type Awaitable<T> = T | PromiseLike<T>;

export interface Signal {
  signal: AbortSignal;
  abort: () => void;
}

export interface Interval {
  interval: number;
  cancel: () => void;
}

export type PollingController = Signal & Interval;

export interface Wait<T = unknown> {
  wait: (controller?: PollingController) => Promise<T>;
}

export interface AsyncData<T> {
  done: boolean;
  data?: T;
}

export type AsyncFunction<T> = () => Awaitable<AsyncData<T>>;

export function createSignal(): Signal {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    abort: () => {
      controller.abort();
    },
  };
}

export function createPollingController(
  timeout: number = 60_000,
  pollingInterval: number = 1500
): PollingController {
  const controller = new AbortController();
  const timeoutId = setTimeout(function () {
    controller.abort();
  }, timeout);
  return {
    signal: controller.signal,
    abort: () => {
      controller.abort();
    },
    interval: pollingInterval,
    cancel: () => {
      clearTimeout(timeoutId);
    },
  };
}

export async function getAsyncPoller<T = unknown>(
  fn: AsyncFunction<T>,
  controller?: PollingController
): Promise<T> {
  const control = controller ?? createPollingController();
  const checkCondition = (
    resolve: (value: T) => void,
    reject: (reason?: any) => void
  ): void => {
    Promise.resolve(fn())
      .then((result: AsyncData<T>) => {
        if (result.done && result.data != null) {
          // We don't want to call `AbortController.abort()` if the call succeeded
          control.cancel();
          return resolve(result.data);
        }
        if (control.signal.aborted) {
          // We don't want to call `AbortController.abort()` if the call is already aborted
          control.cancel();
          return reject(control.signal.reason);
        } else {
          setTimeout(checkCondition, control.interval, resolve, reject);
        }
      })
      .catch((err) => {
        return reject(err);
      });
  };
  return await new Promise<T>(checkCondition);
}
