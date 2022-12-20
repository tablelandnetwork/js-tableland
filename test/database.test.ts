/* eslint-disable @typescript-eslint/no-non-null-assertion */
import assert, { deepStrictEqual, strictEqual, rejects, match } from "assert";
import { describe, test } from "mocha";
import { getAccounts } from "@tableland/local";
import { getDefaultProvider } from "ethers";
import { getChainId, overrideDefaults } from "../src/helpers/index.js";
import { Database } from "../src/database.js";
import { Statement } from "../src/statement.js";

// TODO: Create a test that checks that the chainId is being auto-detected from a read query

// Just to test out these functions
overrideDefaults(getChainId("localhost"), {
  contractAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
});

describe("database", function () {
  // Note that we're using the second account here
  const [, wallet] = getAccounts();
  const provider = getDefaultProvider("http://127.0.0.1:8545");
  const signer = wallet.connect(provider);
  const db = new Database({ signer });

  test("when initialized via constructor", async function () {
    const db = new Database({ signer, baseUrl: "baseUrl" });
    strictEqual(db.config.signer, signer);
    strictEqual(db.config.baseUrl, "baseUrl");
  });

  test("when initialized via .readOnly()", async function () {
    const db = await Database.readOnly("polygon-mumbai");
    strictEqual(db.config.signer, undefined);
    strictEqual(db.config.baseUrl, "https://testnet.tableland.network/api/v1");
  });

  test("when initialized via .forSigner()", async function () {
    const db = await Database.forSigner(signer);
    strictEqual(db.config.signer, signer);
    strictEqual(db.config.baseUrl, "http://localhost:8080/api/v1");
  });

  describe(".prepare()", function () {
    test("when creating prepared statement via .prepare()", async function () {
      const sql = "INSERT INTO my_table VALUES (?);";
      const stmt = db.prepare(sql).bind(1);
      strictEqual(stmt.toString(), "INSERT INTO my_table VALUES (1);");
      deepStrictEqual(
        stmt,
        new Statement(db.config, sql, { anon: [1], named: {} })
      );
    });
  });

  describe(".batch()", function () {
    let tableName: string;
    this.beforeAll(async function () {
      this.timeout("10s");
      const { results, error, meta } = await db
        .prepare(
          "CREATE TABLE test_batch (id integer, name text, age integer, primary key (id));"
        )
        .run();
      tableName = meta.txn?.name ?? "";
      deepStrictEqual(results, []);
      strictEqual(error, undefined);
      match(tableName, /^test_batch_31337_\d+$/);

      await meta.txn?.wait();
    });

    test("when trying to create a table fails in a batch", async function () {
      const batch = db.batch([
        db.prepare(`CREATE TABLE inval!idname! (id INTEGER, name TEXT);`),
      ]);
      await rejects(batch, (err: any) => {
        strictEqual(
          err.cause.message,
          "error parsing statement: syntax error at position 18 near '!'"
        );
        return true;
      });
    });

    test("when batching mutations with a create throws an error", async function () {
      const stmt = db.prepare(
        `INSERT INTO wontwork_31337_3 (name, age) VALUES (?1, ?2)`
      );
      // This also demonstates _why_ it would be hard to batch a create with mutations...
      // We don't know the table name!
      const batch = db.batch([
        db.prepare("CREATE TABLE wontwork (name text, age integer);"),
        stmt.bind("Bobby", 5),
        stmt.bind("Tables", 6),
      ]);
      await rejects(batch, (err: any) => {
        strictEqual(
          err.cause.message,
          "statement error: batch must contain uniform types (e.g., CREATE, INSERT, SELECT, etc)"
        );
        return true;
      });
    });

    test("when batching mutations with reads throws an error", async function () {
      const stmt = db.prepare(
        `INSERT INTO ${tableName} (name, age) VALUES (?1, ?2)`
      );
      const batch = db.batch([
        stmt.bind("Bobby", 5),
        stmt.bind("Tables", 6),
        db.prepare(`SELECT * FROM ${tableName}`),
      ]);
      await rejects(batch, (err: any) => {
        strictEqual(
          err.cause.message,
          "statement error: batch must contain uniform types (e.g., CREATE, INSERT, SELECT, etc)"
        );
        return true;
      });

      const results = await db.prepare("SELECT * FROM " + tableName).all();
      strictEqual(results.results.length, 0);
    });

    test("when batching mutations works and adds rows", async function () {
      const stmt = db.prepare(
        `INSERT INTO ${tableName} (name, age) VALUES (?1, ?2)`
      );
      const batch = await db.batch([
        stmt.bind("Bobby", 5),
        stmt.bind("Tables", 42),
      ]);
      strictEqual(batch.length, 1);
      const { meta } = batch.pop() ?? {};
      assert(meta!.duration != null);
      assert(meta!.txn?.transactionHash != null);
      strictEqual(meta!.txn.name, tableName);

      await meta?.txn?.wait();

      const results = await db.prepare("SELECT * FROM " + tableName).all();
      strictEqual(results.results.length, 2);
    });

    describe("with autoWait turned on", function () {
      this.beforeAll(() => {
        db.config.autoWait = true;
      });
      test("when batching throws a runtime error", async function () {
        const stmt = db.prepare(
          `INSERT INTO ${tableName} (id, name, age) VALUES (1, ?1, ?2)`
        );
        await rejects(
          db.batch([stmt.bind("Bobby", 5), stmt.bind("Tables", 42)]),
          (err: any) => {
            match(err.cause.message, /.*UNIQUE constraint failed.*/);
            return true;
          }
        );
      });
      this.afterAll(() => {
        db.config.autoWait = false;
      });
    });

    test("when batching reads they are sent separately", async function () {
      {
        // Seed some data just in case this is run independently
        const { meta } = await db
          .prepare(
            `INSERT INTO ${tableName} (name, age) VALUES (?1, ?2), (?1, ?2)`
          )
          .bind("Bobby", 3)
          .run();

        await meta.txn?.wait();
      }
      const stmt = db.prepare(
        `SELECT name, age FROM ${tableName} WHERE name=?`
      );
      const batch = await db.batch([stmt.bind("Bobby"), stmt.bind("Tables")]);
      strictEqual(batch.length, 2);

      // First one should have at least two rows, second should have 2 fewer rows
      const [first, second] = batch.map((res) => res.results.length);
      assert(first >= 2 && second === first - 2);
      const { meta } = batch.pop() ?? {};
      assert(meta!.duration != null);
      strictEqual(meta!.txn, undefined);
    });

    test("when using an abort controller to halt a batch of reads", async function () {
      {
        // Seed some data just in case this is run independently
        const { meta } = await db
          .prepare(
            `INSERT INTO ${tableName} (name, age) VALUES (?1, ?2), (?1, ?2)`
          )
          .bind("Tables", 6)
          .run();
        await meta.txn?.wait();
      }
      const stmt = db.prepare(
        `SELECT name, age FROM ${tableName} WHERE name=?`
      );
      const controller = new AbortController();
      const signal = controller.signal;
      controller.abort();
      await rejects(
        db.batch([stmt.bind("Bobby"), stmt.bind("Tables")], {
          signal,
        }),
        (err: any) => {
          strictEqual(err.cause.message, "The operation was aborted.");
          return true;
        }
      );
    });
  });

  describe(".exec()", function () {
    let tableName: string;
    this.beforeAll(async function () {
      this.timeout("10s");
      const { results, error, meta } = await db
        .prepare(
          "CREATE TABLE test_exec (id integer, name text, age integer, primary key (id));"
        )
        .run();
      tableName = meta.txn?.name ?? "";
      deepStrictEqual(results, []);
      strictEqual(error, undefined);
      match(tableName, /^test_exec_31337_\d+$/);

      await meta.txn?.wait();
    });

    test("when executing mutations with a create throws an error", async function () {
      const sql = `CREATE TABLE wontwork (name text, age integer);
      INSERT INTO wontwork_31337_3 (name, age) VALUES ('Bobby', 5);
      INSERT INTO wontwork_31337_3 (name, age) VALUES ('Tables', 6);`;
      await rejects(db.exec(sql), (err: any) => {
        match(
          err.cause.message,
          /^error parsing statement: syntax error at position \d+ near 'INSERT'$/
        );
        return true;
      });
    });

    test("when executing mutations with reads throws an error", async function () {
      const sql = `INSERT INTO ${tableName} (name, age) VALUES ('Bobby', 5);
      INSERT INTO ${tableName} (name, age) VALUES ('Tables', 6);
      SELECT * FROM ${tableName}`;
      await rejects(db.exec(sql), (err: any) => {
        match(
          err.cause.message,
          /^error parsing statement: syntax error at position \d+ near 'SELECT'/
        );
        return true;
      });

      const results = await db.prepare("SELECT * FROM " + tableName).all();
      strictEqual(results.results.length, 0);
    });

    test("when executing mutations works and adds rows", async function () {
      const sql = `INSERT INTO ${tableName} (name, age) VALUES ('Bobby', 5);
      INSERT INTO ${tableName} (name, age) VALUES ('Tables', 6);`;
      const { meta } = await db.exec(sql);
      assert(meta.duration != null);
      strictEqual(meta.count, 2);
      assert(meta.txn != null);

      await meta.txn.wait();

      const results = await db.prepare("SELECT * FROM " + tableName).all();
      strictEqual(results.results.length, 2);
    });

    describe("with autoWait turned on", function () {
      this.beforeAll(() => {
        db.config.autoWait = true;
      });
      test("when executing throws a runtime error", async function () {
        const sql = `INSERT INTO ${tableName} (id, name, age) VALUES (1, 'Bobby', 5);
          INSERT INTO ${tableName} (id, name, age) VALUES (1, 'Tables', 42)`;
        await rejects(db.exec(sql), (err: any) => {
          match(err.cause.message, /.*UNIQUE constraint failed.*/);
          return true;
        });
      });
      this.afterAll(() => {
        db.config.autoWait = false;
      });
    });

    test("when attempting to execute multiple reads fails", async function () {
      const sql = `SELECT name, age FROM ${tableName} WHERE name='Bobby';
      SELECT name, age FROM ${tableName} WHERE name='Tables';`;
      await rejects(db.exec(sql), (err: any) => {
        match(
          err.cause.message,
          /error parsing statement: syntax error at position \d+ near 'SELECT'/
        );
        return true;
      });
    });

    test("when a single read statement is executed it doesn't generate output", async function () {
      {
        // Seed some data just in case this is run independently
        const { meta } = await db
          .prepare(
            `INSERT INTO ${tableName} (name, age) VALUES (?1, ?2), (?1, ?2)`
          )
          .bind("Bobby", 3)
          .run();
        await meta.txn?.wait();
      }
      const sql = `SELECT name, age FROM ${tableName} WHERE name='Bobby';`;
      const { meta } = await db.exec(sql);
      strictEqual(meta.count, 1);
      assert(meta.duration != null);
      strictEqual(meta.txn, undefined);
    });
  });

  describe(".dump()", function () {
    test("while dump isn't yet implemented", async function () {
      await rejects(db.dump(), (err: any) => {
        strictEqual(err.cause.message, "not implemented yet");
        return true;
      });
    });
  });
});
