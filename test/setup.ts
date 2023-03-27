import { after, before } from "mocha";
import { LocalTableland } from "@tableland/local";

const lt = new LocalTableland({
  silent: true,
  // TODO: remove the local path once evm publishes the new contract
  registryDir: "/Users/jwagner/Workspaces/textile/github/evm-tableland",
});

before(async function () {
  this.timeout(30_000);
  await lt.start();
});

after(async function () {
  await lt.shutdown();
});
