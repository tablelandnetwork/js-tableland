import test, { Test } from "tape";
import { LocalTableland } from "@tableland/local";

let initializing: Promise<void> | undefined;
let ready = false;
let localNetwork: LocalTableland | undefined;
// Tape doesn't have a beforeAll global hook so we are rolling our own here
export const setup = function (t: Test) {
  // if the local network is running the caller can proceed, but we
  // wait so that tests don't hit the request rate limit on the validator
  if (ready)
    return new Promise((resolve) => setTimeout(() => resolve(0), 2500));

  // increase the timeout since this might take a while
  t.timeoutAfter(200 * 1000);
  // if the promise exists return it so the caller can await it
  if (initializing) return initializing;

  // keep the promise that is starting the local network in memory so setup can be called repeatedly
  initializing = (async function () {
    // start the local node for all tests
    localNetwork = new LocalTableland({ silent: true });

    localNetwork.start();

    await localNetwork.isReady();

    ready = true;
  })();

  return initializing;
};

// Tape will run this after all tests are run
test.onFinish(async function () {
  console.log("onFinish");
  if (!localNetwork) return;
  console.log("shutting down");
  await localNetwork.shutdown();
  console.log("shutdown");
});
