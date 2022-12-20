import { after, before } from "mocha";
import { LocalTableland } from "@tableland/local";

const lt = new LocalTableland({
  silent: true,
  validatorDir: "../go-tableland",
  verbose: false,
});

before(async function () {
  this.timeout(30_000);
  await lt.start();
});

after(async function () {
  await lt.shutdown();
});
