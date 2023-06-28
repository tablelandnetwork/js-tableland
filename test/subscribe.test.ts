import { match, rejects, throws, strictEqual, deepStrictEqual } from "assert";
import { EventEmitter } from "events";
import { describe, test } from "mocha";
import { getDefaultProvider, Contract } from "ethers";
import { getAccounts } from "@tableland/local";
import { Database } from "../src/database.js";
import { Registry } from "../src/registry/index.js";
import { TableEventBus } from "../src/helpers/subscribe.js";
import { TEST_TIMEOUT_FACTOR } from "./setup";

describe("subscribe", function () {
  this.timeout(TEST_TIMEOUT_FACTOR * 10000);

  // Note that we're using the second account here
  const [, wallet, wallet2] = getAccounts();
  const provider = getDefaultProvider("http://127.0.0.1:8545");
  const signer = wallet.connect(provider);
  const db = new Database({ signer });

  describe("TableEventBus", function () {
    const eventBus = new TableEventBus(db.config);

    test("using read-only Database config throws", async function () {
      const db = new Database();

      throws(
        function () {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const eveBus = new TableEventBus(db.config);
        },
        { message: "missing signer information" }
      );
    });

    test("can listen for transfer event", async function () {});
    test("addListener() throws if called without a table name", async function () {
      await rejects(
        async function () {
          // @ts-expect-error intentionally giving wrong number of args
          await eventBus.addListener();
        },
        { message: "table name is required to add listener" }
      );
    });

    test("addListener() adding the same table twice only uses one emitter", async function () {
      const { meta } = await db
        .prepare("CREATE TABLE test_table_subscribe (id integer, name text);")
        .run();
      const tableName = meta.txn?.name ?? "";
      await meta.txn?.wait();

      const eventBus = new TableEventBus(db.config);
      deepStrictEqual(eventBus.listeners, {});

      const tableIdentifier = "_" + tableName.split("_").slice(-2).join("_");

      await eventBus.addListener(`${tableName}`);
      deepStrictEqual(Object.keys(eventBus.listeners), [tableIdentifier]);

      await eventBus.addListener(`${tableName}`);
      deepStrictEqual(Object.keys(eventBus.listeners), [tableIdentifier]);
    });

    test("removeListener() throws if called without a table identifier", async function () {
      throws(
        function () {
          // @ts-expect-error intentionally giving wrong number of args
          eventBus.removeListener();
        },
        { message: "must provide chainId and tableId to remove a listener" }
      );
    });

    test("removeListener() throws if called with a non-existent table identifier", async function () {
      throws(
        function () {
          eventBus.removeListener({ chainId: 123, tableId: "123" });
        },
        { message: "cannot remove listener that does not exist" }
      );
    });

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

    test("addListener() can be used to listen for transfer of a table", function (done) {
      const go = async function (): Promise<void> {
        const { meta } = await db
          .prepare("CREATE TABLE test_table_transfer (id integer, name text);")
          .run();
        const tableName = meta.txn?.name ?? "";
        const tableId = tableName.split("_").pop() ?? "";
        await meta.txn?.wait();

        const bus = await eventBus.addListener(`${tableName}`);
        bus.on("transfer", function (eve: any) {
          const from = eve[0];
          const to = eve[1];
          const eventTableId = eve[2].toString();
          const txn = eve[3];

          match(from, /^0x[0-9a-fA-F]+$/);
          match(to, /^0x[0-9a-fA-F]+$/);
          strictEqual(tableId, eventTableId);
          strictEqual(txn.event, "TransferTable");
          match(txn.transactionHash, /^0x[0-9a-fA-F]+$/);

          eventBus.removeAllListeners();
          done();
        });

        const registry = new Registry({ signer });
        await registry.safeTransferFrom({
          to: wallet2.address,
          tableName: {
            chainId: 31337,
            tableId,
          },
        });
      };

      go().catch(function (err: Error) {
        done(err);
      });
    });

    test("addListener() can be used to listen for setting controller of a table", function (done) {
      const go = async function (): Promise<void> {
        const { meta } = await db
          .prepare("CREATE TABLE test_table_transfer (id integer, name text);")
          .run();
        const tableName = meta.txn?.name ?? "";
        const tableId = tableName.split("_").pop() ?? "";
        await meta.txn?.wait();

        const bus = await eventBus.addListener(`${tableName}`);
        bus.on("set-controller", function (eve: any) {
          const eventTableId = eve[0].toString();
          const controller = eve[1];

          strictEqual(tableId, eventTableId);
          match(controller, /^0x[0-9a-fA-F]+$/);

          eventBus.removeAllListeners();
          done();
        });

        const registry = new Registry({ signer });
        await registry.setController({
          controller: wallet2.address,
          tableName,
        });
      };

      go().catch(function (err: Error) {
        done(err);
      });
    });

    test("addTableIterator() can be used to listen for changes to a table", function (done) {
      this.timeout(TEST_TIMEOUT_FACTOR * 30000);

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

    test("removeAllListeners() removes all listeners and stops listening to the contract", async function () {
      const { meta } = await db
        .prepare("CREATE TABLE test_table_subscribe (id integer, name text);")
        .run();
      const tableName = meta.txn?.name ?? "";
      await meta.txn?.wait();

      const tableIdentifier = "_" + tableName.split("_").slice(-2).join("_");

      const eventBus = new TableEventBus(db.config);
      deepStrictEqual(eventBus.contracts, {});
      deepStrictEqual(eventBus.listeners, {});

      await eventBus.addListener(`${tableName}`);
      const listeners = eventBus.listeners[tableIdentifier];

      strictEqual(eventBus.contracts["31337"] instanceof Contract, true);
      strictEqual(listeners.chainId, 31337);
      strictEqual(listeners.tableId, tableIdentifier.split("_")[2]);
      strictEqual(listeners.emitter instanceof EventEmitter, true);
      strictEqual(listeners.contractListeners instanceof Array, true);
      // 3 is the number of Solidity events we enable listening to
      strictEqual(listeners.contractListeners.length, 3);

      eventBus.removeAllListeners();
      deepStrictEqual(eventBus.listeners, {});
    });
  });
});
