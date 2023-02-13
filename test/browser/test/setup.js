// NOTES:
//  - Playwright will start the app in `../server` before running tests
//  - Playwright uses a custom loader. https://nodejs.org/docs/latest-v18.x/api/esm.html#loaders
//    This does not work with Hardhat and Local Tableland. This may be related to https://github.com/microsoft/playwright/issues/16185
//    As a workaround the playwright tests are run with the PW_TS_ESM_ON env var set.
//    Which means tests can not use typescript.
import { LocalTableland } from "../server/node_modules/@tableland/local/dist/esm/main.js";

export default async function () {
  const lt = new LocalTableland({
    silent: true
  });

  await lt.start();

  return async function () {
    await lt.shutdown();
  }
};
