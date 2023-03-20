import { deepStrictEqual, match, strictEqual } from "assert";
import { describe, test } from "mocha";
import { getDefaultProvider } from "ethers";
import { getAccounts } from "@tableland/local";
import { Database } from "../src/database.js";
import { TableEventBus } from "../src/helpers/subscribe.js";

describe("subscribe", function () {
  this.timeout("10s");
  // Note that we're using the second account here
  const [, wallet] = getAccounts();
  const provider = getDefaultProvider("http://127.0.0.1:8545");
  const signer = wallet.connect(provider);
  const db = new Database({ signer });

  let tableName: string;
  this.beforeAll(async function () {
    const { results, error, meta } = await db
      .prepare(
        "CREATE TABLE test_table_subscribe (id integer, name text, age integer, primary key (id));"
      )
      .run();
    tableName = meta.txn?.name ?? "";

    deepStrictEqual(results, []);
    strictEqual(error, undefined);
    match(tableName, /^test_table_subscribe_31337_\d+$/);

    await meta.txn?.wait();
  });

  describe("addTableListener()", function () {
    const eventBus = new TableEventBus(db.config);

    test("is notified of changes to a table", function (done) {
      this.timeout("30s");
      const go = async function (): Promise<void> {
        const bus = await eventBus.addTableListener(`${tableName}`);
        bus.on("change", function (eve) {
          console.log(eve);

          done();
        });

        await db
          .prepare(
            `INSERT INTO ${tableName} (id, name, age) VALUES (1, 'winston', 200);`
          )
          .all();
      };
      go().catch((err: Error) => {
        done(err);
      });
    });
  });
});
