import test, { Test } from "tape";
import fetch from "node-fetch";
import { LocalTableland } from "@tableland/local";

// @ts-ignore
globalThis.fetch = fetch;

let initializing: Promise<void> | undefined;
let ready = false;
let localNetwork: LocalTableland | undefined;
export const setup = function (t: Test) {
  // if the local network is running the caller can proceed, but we
  // wait so that tests for hit the request rate limit on the validator
  if (ready)
    return new Promise((resolve) => setTimeout(() => resolve(0), 2500));

  // increase the timeout since this might take a while
  t.timeoutAfter(200 * 1000);
  // if the promise exists return it so the caller can await it
  if (initializing) return initializing;

  // start the local network
  initializing = new Promise(function (resolve) {
    // start the local node for all tests
    localNetwork = new LocalTableland(/* config in tableland.config.js */);

    localNetwork.start();

    localNetwork.initEmitter.on("validator ready", () => {
      ready = true;
      resolve();
    });
  });

  return initializing;
};

// TODO: handle starting the local node in setup for all tests
test.onFinish(async function () {
  console.log("onFinish");
  if (!localNetwork) return;
  console.log("shutting down");
  await localNetwork.shutdown();
  console.log("shutdown");
});
