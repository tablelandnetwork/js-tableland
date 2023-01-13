/* eslint-disable @typescript-eslint/no-non-null-assertion */
import assert, {
  strictEqual,
  rejects,
  match,
  notStrictEqual,
  deepStrictEqual,
} from "assert";
import { describe, test } from "mocha";
import { getAccounts } from "@tableland/local";
import { getDelay, getRange } from "../src/helpers/utils.js";
import {
  getDefaultProvider,
  getBaseUrl,
  getChainId,
} from "../src/helpers/index.js";
import { Database } from "../src/index.js";
import { Validator } from "../src/validator/index.js";
import type { WaitableTransactionReceipt } from "../src/registry/index.js";

const chainId = getChainId("local-tableland");

describe("validator", function () {
  // Note that we're using the second account here
  const [, wallet] = getAccounts();
  const provider = getDefaultProvider("http://127.0.0.1:8545");
  const baseUrl = getBaseUrl(chainId);
  const signer = wallet.connect(provider);
  const db = new Database({ signer, autoWait: true, baseUrl });
  const api = new Validator({ baseUrl });
  let txn: WaitableTransactionReceipt;

  test("when initialized via constructor", async function () {
    const reg = new Validator({ baseUrl });
    strictEqual(reg.config.baseUrl, baseUrl);
  });

  test("when initialized via .forChain()", async function () {
    const reg = Validator.forChain("maticmum");
    strictEqual(reg.config.baseUrl, getBaseUrl("maticmum"));
  });

  this.beforeAll(async function () {
    this.timeout("10s");
    const { meta } = await db
      .prepare(
        "CREATE TABLE test_apis (id integer, name text not null, primary key (id));"
      )
      .run();
    txn = meta.txn!;
    match(txn.name, /^test_apis_31337_\d+$/);
  });

  describe("health", function () {
    test("when we call the health api and all is good", async function () {
      const response = await api.health();
      strictEqual(response, true);
    });
  });

  describe("version", function () {
    test("when we call the version api and all is good", async function () {
      const response = await api.version();
      notStrictEqual(response.binaryVersion, undefined);
      notStrictEqual(response.buildDate, undefined);
      notStrictEqual(response.gitBranch, undefined);
      notStrictEqual(response.gitCommit, undefined);
      notStrictEqual(response.gitState, undefined);
      notStrictEqual(response.gitSummary, undefined);
    });
  });

  describe("receipt", function () {
    test("when we call the receipt api and all is good", async function () {
      const { chainId, transactionHash } = txn;
      const response = await api.receiptByTransactionHash({
        chainId,
        transactionHash,
      });
      strictEqual(response.transactionHash, transactionHash);
      strictEqual(response.chainId, chainId);
      strictEqual(response.error, undefined);
      strictEqual(response.tableId, txn.tableId);
      strictEqual(response.blockNumber, txn.blockNumber);
    });

    test("when we call the receipt api with unsupported chain id", async function () {
      const { transactionHash } = txn;
      await rejects(
        api.receiptByTransactionHash({
          chainId: 1,
          transactionHash,
        }),
        (err: any) => {
          strictEqual(err.message, "unsupported chain id");
          return true;
        }
      );
    });

    test("when we call the receipt api with missing transaction hash", async function () {
      const { chainId } = txn;
      await rejects(
        api.receiptByTransactionHash({
          chainId,
          transactionHash: "not found",
        }),
        (err: any) => {
          strictEqual(err.message, "Not Found");
          return true;
        }
      );
    });

    describe("without autoWait", function () {
      this.timeout("10s");
      let transactionHash: string = "";
      this.beforeEach(async () => {
        db.config.autoWait = false;
        try {
          const { meta } = await db
            .prepare(`INSERT INTO ${txn.name}(name) VALUES(NULL);`)
            .run();
          transactionHash = meta.txn!.transactionHash!;
          // This will throw
          await meta.txn?.wait();
        } catch (err) {
          // no op
        }
      });
      test("when we call the receipt api and it returns an error", async function () {
        const receipt = await api.receiptByTransactionHash({
          chainId,
          transactionHash,
        });
        match(receipt.error!, /.*msg: NOT NULL constraint failed:.*/);
      });
      this.afterEach(() => {
        db.config.autoWait = true;
      });
    });

    describe("without autoWait", function () {
      this.timeout("10s");
      let localTransaction: WaitableTransactionReceipt;
      this.beforeEach(async () => {
        db.config.autoWait = false;
        const {
          meta: { txn: localTxn },
        } = await db
          .prepare(`INSERT INTO ${txn.name}(name) VALUES('Lucas');`)
          .run();
        localTransaction = localTxn!;
      });
      test("when we poll for a transaction receipt and it succeeds", async function () {
        const { chainId, transactionHash } = localTransaction;

        const response = await api.pollForReceiptByTransactionHash({
          chainId,
          transactionHash,
        });
        strictEqual(response.transactionHash, transactionHash);
        strictEqual(response.chainId, chainId);
        strictEqual(response.error, undefined);
        strictEqual(response.tableId, localTransaction.tableId);
        strictEqual(response.blockNumber, localTransaction.blockNumber);
      });
      this.afterEach(() => {
        db.config.autoWait = true;
      });
    });

    describe("without autoWait", function () {
      let transactionHash: string = "";
      this.timeout("10s");
      this.beforeEach(async () => {
        db.config.autoWait = false;
        try {
          const { meta } = await db
            .prepare(`INSERT INTO ${txn.name}(name) VALUES(NULL);`)
            .run();
          transactionHash = meta.txn!.transactionHash;
          // This will throw
          await meta.txn?.wait();
        } catch (err) {
          // no op
        }
      });
      test("when we poll for a transaction receipt and it fails", async function () {
        try {
          const { meta } = await db
            .prepare(`INSERT INTO ${txn.name}(name) VALUES(NULL);`)
            .run();
          transactionHash = meta.txn!.transactionHash;
        } catch (err) {
          /* c8 ignore next 2 */
        }

        const receipt = await api.pollForReceiptByTransactionHash({
          chainId,
          transactionHash,
        });
        match(receipt.error!, /.*msg: NOT NULL constraint failed:.*/);
      });
      this.afterEach(() => {
        db.config.autoWait = true;
      });
    });
  });

  describe("tables", function () {
    test("when we call the tables api and all is good", async function () {
      const response = await api.getTableById({
        chainId: 31337,
        tableId: "1",
      });
      assert(response.attributes != null);
      strictEqual(response.attributes[0].displayType, "date");
      strictEqual(
        response.animationUrl,
        "https://render.tableland.xyz/?chain=31337&id=1"
      );
      // TODO: This is correct, but shouldn't it be updated to the new API endpoints?
      strictEqual(
        response.externalUrl,
        "http://localhost:8080/chain/31337/tables/1"
      );
      strictEqual(
        response.image,
        "https://bafkreifhuhrjhzbj4onqgbrmhpysk2mop2jimvdvfut6taiyzt2yqzt43a.ipfs.dweb.link"
      );
      strictEqual(response.name, "healthbot_31337_1");
      deepStrictEqual(response.schema, {
        columns: [
          {
            name: "counter",
            type: "integer",
          },
        ],
      });
    });

    test("when we call the tables api on an empty table", async function () {
      const { chainId, tableId } = txn;
      await rejects(
        api.getTableById({
          chainId,
          tableId,
        }),
        (err: any) => {
          strictEqual(err.message, "Failed to fetch metadata");
          return true;
        }
      );
    });

    test("when we call the tables api with invalid params", async function () {
      await rejects(
        api.getTableById({
          chainId: 31337,
          tableId: "-1",
        }),
        (err: any) => {
          strictEqual(err.message, "Invalid id format");
          return true;
        }
      );
    });

    test("when we call the tables api on a missing table", async function () {
      await rejects(
        api.getTableById({
          chainId,
          tableId: "0",
        }),
        (err: any) => {
          strictEqual(err.message, "Not Found");
          return true;
        }
      );
    });
  });
  describe("query", function () {
    test("where we get no rows back from a query", async function () {
      // The remote API returns 404 here, but downstream (in the sdk) we catch it
      await rejects(
        api.queryByStatement<{ counter: number }>({
          statement: `select * from ${txn.name} where id=-1;`,
          format: "objects",
        }),
        (err: any) => {
          strictEqual(err.message, "Row not found");
          return true;
        }
      );
    });

    test("where query is called with an invalid statement", async function () {
      await getDelay(500);
      await rejects(
        api.queryByStatement<{ counter: number }>({
          statement: `select nothing from blurg*;`,
        }),
        (err: any) => {
          strictEqual(
            err.message,
            "validating query: unable to parse the query: syntax error at position 14 near 'nothing'"
          );
          return true;
        }
      );
    });

    test("where query is called with format as 'objects'", async function () {
      await getDelay(500);
      const response = await api.queryByStatement<{ counter: number }>({
        statement: "select * from healthbot_31337_1;",
        format: "objects",
      });
      deepStrictEqual(response, [{ counter: 1 }]);
    });

    test("where query is called with format as 'table'", async function () {
      await getDelay(500);
      const response = await api.queryByStatement<{ counter: number }>({
        statement: "select * from healthbot_31337_1;",
        format: "table",
      });
      deepStrictEqual(response.columns, [{ name: "counter" }]);
      deepStrictEqual(response.rows, [[1]]);
    });

    test("where query is called with unwrap as 'true' on multiple rows", async function () {
      // TODO: Note that for now we'll fail here, but it would be nice to handle NDJSON
      this.timeout("10s");
      await getDelay(500);
      const { meta } = await db
        .prepare("CREATE TABLE test_unwrap_rows (keyy TEXT, val TEXT);")
        .run();
      await db.batch([
        db.prepare(
          `INSERT INTO ${
            meta.txn?.name ?? ""
          } (keyy, val) VALUES ('tree', 'aspen')`
        ),
        db.prepare(
          `INSERT INTO ${
            meta.txn?.name ?? ""
          } (keyy, val) VALUES ('tree', 'pine')`
        ),
      ]);
      await rejects(
        api.queryByStatement<{ counter: number }>({
          statement: `SELECT * FROM ${meta.txn?.name ?? ""};`,
          unwrap: true,
        }),
        (err: any) => {
          strictEqual(err.message, "Unexpected token { in JSON at position 30");
          return true;
        }
      );
    });

    test("where query is called with extract as 'true'", async function () {
      await getDelay(500);
      const response = await api.queryByStatement<{ counter: number }>({
        statement: "select * from healthbot_31337_1;",
        extract: true,
      });
      deepStrictEqual(response, [1]);
    });

    test("where query is called with extract as 'true' on multiple columns", async function () {
      this.timeout("10s");
      await getDelay(500);
      const { meta } = await db
        .prepare("CREATE TABLE test_unwrap_rows (keyy TEXT, val TEXT);")
        .run();
      await db
        .prepare(
          `INSERT INTO ${
            meta.txn?.name ?? ""
          } (keyy, val) VALUES ('tree', 'aspen')`
        )
        .run();
      await rejects(
        api.queryByStatement<{ counter: number }>({
          statement: `SELECT * FROM ${meta.txn?.name ?? ""};`,
          extract: true,
        }),
        (err: any) => {
          strictEqual(
            err.message,
            "Error formatting data: extracting values: can only extract values for result sets with one column but this has 2"
          );
          return true;
        }
      );
    });

    test("where query is called with unwrap as 'true'", async function () {
      await getDelay(500);
      const response = await api.queryByStatement<{ counter: number }>({
        statement: "select * from healthbot_31337_1;",
        unwrap: true,
      });
      deepStrictEqual(response, { counter: 1 });
    });

    test("where query returns a column with json", async function () {
      this.timeout("10s");
      await getDelay(500);
      const { meta } = await db
        .prepare(
          "CREATE TABLE test_apis_json (id integer, json text not null);"
        )
        .run();
      const jsonTableName = meta.txn!.name;
      await getDelay(500);
      await db
        .prepare(
          `INSERT INTO ${jsonTableName} VALUES (1, '{ "name": "Bobby Tables" }')`
        )
        .run();
      // TODO: This is potentially unexpected results, is it sufficiently documented?
      const response = await api.queryByStatement<{ id: number; json: any }>({
        statement: `select * from ${jsonTableName};`,
      });
      const expected = [
        {
          id: 1,
          json: {
            name: "Bobby Tables",
          },
        },
      ];
      deepStrictEqual(response, expected);
    });
  });

  describe("rate limit", function () {
    test("when we make too many calls and get an exception", async function () {
      await rejects(
        Promise.all(getRange(10).map(async () => await api.health())),
        (err: any) => {
          strictEqual(err.message, "Too Many Requests");
          return true;
        }
      );
      await getDelay(1000);
    });
  });
});
