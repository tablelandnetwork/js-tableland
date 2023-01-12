import { match, rejects, strictEqual } from "assert";
import { describe, test } from "mocha";
import {
  AsyncFunction,
  getAbortSignal,
  getAsyncPoller,
  SignalAndInterval,
} from "../src/helpers/await.js";
import { getDelay } from "../src/helpers/utils.js";

describe("await", function () {
  test("ensure polling stops after successful results", async function () {
    let callCount = 0;
    async function testPolling({
      signal,
      interval,
    }: SignalAndInterval = {}): Promise<boolean> {
      let first = true;
      const fn: AsyncFunction<boolean> = async () => {
        callCount += 1;
        if (first) {
          first = false;
          return { done: false };
        }
        await getDelay(10);
        return { done: true, data: true };
      };
      return await getAsyncPoller(fn, interval, signal);
    }
    const controller = new AbortController();
    const signal = controller.signal;
    await testPolling({ signal, interval: 10 });
    await getDelay(1000);
    strictEqual(callCount, 2);
  });

  test("ensure polling stops after timeout", async function () {
    async function testPolling({
      signal,
      interval,
    }: SignalAndInterval = {}): Promise<boolean> {
      const fn: AsyncFunction<boolean> = async () => {
        return { done: false };
      };
      return await getAsyncPoller(fn, interval, signal);
    }
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => controller.abort(), 5);
    await rejects(testPolling({ signal, interval: 10 }), (err: any) => {
      match(err.message, /Th(e|is) operation was aborted/);
      return true;
    });
  });

  test("getAbortSignal returns a valid signal", async function () {
    const controller = new AbortController();
    const initial = controller.signal;
    const signal = getAbortSignal(initial, 10);
    strictEqual(signal.aborted, false);
    controller.abort();
    strictEqual(signal.aborted, true);
    strictEqual(initial.aborted, true);
    const third = getAbortSignal(undefined, 10);
    strictEqual(third.aborted, false);
    await new Promise<void>(function (resolve) {
      third.addEventListener("abort", function abortListener() {
        third.removeEventListener("abort", abortListener);
        resolve();
      });
    });
    strictEqual(third.aborted, true);
  });
});
