var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import test from "tape";
import fetch from "node-fetch";
import { LocalTableland } from "@tableland/local";
// @ts-ignore
globalThis.fetch = fetch;
let initializing;
let ready = false;
let localNetwork;
export const setup = function (t) {
    // if the local network is running the caller can proceed, but we
    // wait so that tests for hit the request rate limit on the validator
    if (ready)
        return new Promise(resolve => setTimeout(() => resolve(0), 2500));
    // increase the timeout since this might take a while
    t.timeoutAfter(200 * 1000);
    // if the promise exists return it so the caller can await it
    if (initializing)
        return initializing;
    // start the local network
    initializing = new Promise(function (resolve) {
        // start the local node for all tests
        localNetwork = new LocalTableland( /* config in tableland.config.js */);
        localNetwork.start();
        localNetwork.initEmitter.on("validator ready", () => {
            ready = true;
            resolve();
        });
    });
    return initializing;
};
// TODO: handle starting the local node in setup for all tests
test.onFinish(function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("onFinish");
        if (!localNetwork)
            return;
        console.log("shutting down");
        yield localNetwork.shutdown(true);
        console.log("shutdown");
    });
});
//# sourceMappingURL=setupTest.js.map