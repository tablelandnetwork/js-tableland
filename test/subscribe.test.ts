import { match, strictEqual } from "assert";
import { describe, test } from "mocha";
import { getDefaultProvider } from "ethers";
import { getAccounts } from "@tableland/local";
import { Database } from "../src/database.js";
import { TableEventBus } from "../src/helpers/subscribe.js";
import { TEST_TIMEOUT_FACTOR } from "./setup";

describe("subscribe", function () {
  this.timeout(TEST_TIMEOUT_FACTOR * 10000);

  // Note that we're using the second account here
  const [, wallet] = getAccounts();
  const provider = getDefaultProvider("http://127.0.0.1:8545");
  const signer = wallet.connect(provider);
  const db = new Database({ signer });

  describe("TableEventBus", function () {
    const eventBus = new TableEventBus(db.config);

    test("addListener() can be used to listen for changes to a table", function (done) {
      const go = async function (): Promise<void> {
        const { meta } = await db
          .prepare("CREATE TABLE test_table_subscribe (id integer, name text);")
          .run();
        const tableName = meta.txn?.name ?? "";
        await meta.txn?.wait();

        const bus = await eventBus.addListener(`${tableName}`);
        bus.on("change", function (eve: any) {
          strictEqual(eve.error, undefined);
          match(eve.tableId, /^\d+$/);
          strictEqual(typeof eve.blockNumber, "number");
          strictEqual(eve.tableIds instanceof Array, true);
          strictEqual(eve.tableIds.length, 1);
          match(eve.transactionHash, /^0x[0-9a-f]+$/);
          strictEqual(eve.chainId, 31337);

          eventBus.removeAllListeners();
          done();
        });

        await db
          .prepare(`INSERT INTO ${tableName} (id, name) VALUES (1, 'winston');`)
          .all();
      };
      go().catch(function (err: Error) {
        done(err);
      });
    });

    test("addTableIterator() can be used to listen for changes to a table", function (done) {
      let tableName: string;
      const go = async function (): Promise<void> {
        const { meta } = await db
          .prepare("CREATE TABLE test_table_subscribe (id integer, name text);")
          .run();
        tableName = meta.txn?.name ?? "";
        await meta.txn?.wait();

        const bus = await eventBus.addTableIterator(`${tableName}`);

        for await (const eve of bus) {
          strictEqual((eve as any).error, undefined);
          match((eve as any).tableId, /^\d+$/);
          strictEqual(typeof (eve as any).blockNumber, "number");
          strictEqual((eve as any).tableIds instanceof Array, true);
          strictEqual((eve as any).tableIds.length, 1);
          match((eve as any).transactionHash, /^0x[0-9a-f]+$/);
          strictEqual((eve as any).chainId, 31337);

          // break after first event and end the test
          eventBus.removeAllListeners();
          done();
        }
      };

      // It's a little awkward to use async iterators in a test like this since they
      // lock up the function with the `for await`` loop, but this gets the job done
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setTimeout(async function () {
        await db
          .prepare(`INSERT INTO ${tableName} (id, name) VALUES (1, 'winston');`)
          .all();
      }, 5000 * TEST_TIMEOUT_FACTOR);

      go().catch(function (err: Error) {
        done(err);
      });
    });
  });
});
