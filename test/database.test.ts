/* eslint-disable @typescript-eslint/no-non-null-assertion */
import assert, { deepStrictEqual, strictEqual, rejects, match } from "assert";
import { describe, test } from "mocha";
import { getAccounts } from "@tableland/local";
import { getDefaultProvider } from "ethers";
import { Database } from "../src/database.js";
import { Statement } from "../src/statement.js";
import { TEST_TIMEOUT_FACTOR } from "./setup";

describe("database", function () {
  this.timeout(TEST_TIMEOUT_FACTOR * 10000);

  const accounts = getAccounts();
  // Note that we're using the second account here
  const wallet = accounts[1];
  const provider = getDefaultProvider("http://127.0.0.1:8545");
  const signer = wallet.connect(provider);
  const db = new Database({ signer, autoWait: true });

  test("when initialized via constructor", async function () {
    const db = new Database({ signer, baseUrl: "baseUrl" });
    strictEqual(db.config.signer, signer);
    strictEqual(db.config.baseUrl, "baseUrl");
  });

  test("when initialized via .readOnly()", async function () {
    const db = Database.readOnly("maticmum");
    strictEqual(db.config.signer, undefined);
    strictEqual(db.config.baseUrl, "https://testnets.tableland.network/api/v1");
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

    test("when trying to create an invalid table fails in a batch", async function () {
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

    test("when trying to batch create with single statement that creates 2 tables it fails", async function () {
      const batch = db.batch([
        db.prepare(
          `CREATE TABLE my_table_1 (id INTEGER, name TEXT);CREATE TABLE my_table_2 (id INTEGER, name TEXT);`
        ),
        db.prepare(`CREATE TABLE my_table_3 (id INTEGER, name TEXT);`),
      ]);
      await rejects(batch, (err: any) => {
        strictEqual(
          err.cause.message,
          "error parsing statement: syntax error at position 54 near 'CREATE'"
        );
        return true;
      });
    });

    test("when creating multiple tables in a batch", async function () {
      const [batch] = await db.batch([
        db.prepare(`CREATE TABLE test_create_1 (id INTEGER, name TEXT);`),
        db.prepare(`CREATE TABLE test_create_2 (id INTEGER, name TEXT);`),
      ]);

      const res = await batch.meta.txn?.wait();

      match(res.names[0], /^test_create_1_31337_\d+$/);
      match(res.names[1], /^test_create_2_31337_\d+$/);
    });

    test("when batching mutations with a create throws an error", async function () {
      const { meta: tableMeta } = await db
        .prepare(
          "CREATE TABLE test_batch (id integer, name text, age integer, primary key (id));"
        )
        .run();
      const tableName = tableMeta.txn?.name ?? "";

      const stmt = db.prepare(
        `INSERT INTO ${tableName} (name, age) VALUES (?1, ?2)`
      );
      // We don't allow batching with different types.  It adds unneeded complexity and
      // isn't overly useful since you can't do things like create and insert because the
      // table ID won't exist until after the transaction is finished, and the inserts must
      // be included in the transaction.
      const batch = db.batch([
        db.prepare("CREATE TABLE willwork (name text, age integer);"),
        stmt.bind("Bobby", 5),
        stmt.bind("Tables", 6),
      ]);

      await rejects(batch, (err: any) => {
        strictEqual(
          err.cause.message,
          "statement error: batch must contain uniform types (i.e. one of: create, write, read, acl)"
        );
        return true;
      });
    });

    test("test batching with a single statement affecting two tables throws an error", async function () {
      const { meta: tableMeta } = await db
        .prepare(
          "CREATE TABLE test_batch (id integer, name text, age integer, primary key (id));"
        )
        .run();
      const tableName2 = tableMeta.txn?.name ?? "";

      // since one sql string is touching two tables, it needs to split it into 2 runnables
      const batch2 = db.batch([
        db.prepare(
          `INSERT INTO ${tableName} (name, age) VALUES ('foo', 2);INSERT INTO ${tableName2} (name, age) VALUES ('bar', 4);`
        ),
      ]);
      await rejects(batch2, (err: any) => {
        strictEqual(
          err.cause.message,
          "each statement can only touch one table. try batching statements based on the table they mutate."
        );
        return true;
      });

      // since the sql string is only touching one table, it can be sent as one runnable
      const [batch1] = await db.batch([
        db.prepare(
          `INSERT INTO ${tableName} (name, age) VALUES ('foo', 2);INSERT INTO ${tableName} (name, age) VALUES ('bar', 4);`
        ),
      ]);
      const res = await batch1.meta.txn.wait();

      strictEqual(res.names.length, 1);
    });

    test("when batching mutations with reads throws an error", async function () {
      const { meta: tableMeta } = await db
        .prepare(
          "CREATE TABLE test_batch_reads (id integer, name text, age integer, primary key (id));"
        )
        .run();

      const tableName = tableMeta.txn?.name ?? "";
      await tableMeta.txn?.wait();

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
          "statement error: batch must contain uniform types (i.e. one of: create, write, read, acl)"
        );
        return true;
      });

      // ensure the table did not have any rows added
      const results = await db.prepare("SELECT * FROM " + tableName).all();
      strictEqual(results.results.length, 0);
    });

    test("when batching mutations works and adds rows", async function () {
      const { meta: tableMeta } = await db
        .prepare(
          "CREATE TABLE test_batch (id integer, name text, age integer, primary key (id));"
        )
        .run();
      const tableName = tableMeta.txn?.name ?? "";

      const stmt = db.prepare(
        `INSERT INTO ${tableName} (name, age) VALUES (?1, ?2)`
      );
      const [batch] = await db.batch([
        stmt.bind("Bobby", 5),
        stmt.bind("Tables", 42),
      ]);

      assert(batch.meta.duration != null);
      assert(batch.meta.txn?.transactionHash != null);
      strictEqual(batch.meta.txn.name, tableName);

      const res = await batch.meta.txn.wait();
      strictEqual(res.names.length, 2);

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
      const [first, second] = batch.map((res: any) => res.results.length);
      assert(first >= 2 && second === first - 2);
      const { meta } = batch.pop() ?? {};
      assert(meta.duration != null);
      strictEqual(meta.txn, undefined);
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
          match(err.cause.message, /Th(e|is) operation was aborted/);
          return true;
        }
      );
    });

    describe("grant and revoke statements", function () {
      // note we are using the third account
      const wallet = accounts[2];
      const provider = getDefaultProvider("http://127.0.0.1:8545");
      const signer = wallet.connect(provider);
      const db2 = new Database({ signer, autoWait: true });

      test("when doing grant with batch", async function () {
        // Need to make a lot of changes in this test, increase timeout
        this.timeout(TEST_TIMEOUT_FACTOR * 20000);

        const [batch] = await db.batch([
          db.prepare(`CREATE TABLE test_grant_1 (id INTEGER, name TEXT);`),
          db.prepare(`CREATE TABLE test_grant_2 (id INTEGER, name TEXT);`),
        ]);
        // db has autoWait turned off
        const res = await batch.meta.txn?.wait();

        match(res.names[0], /^test_grant_1_31337_\d+$/);
        match(res.names[1], /^test_grant_2_31337_\d+$/);

        // TODO: batch return types aren't setup, so using `as` to keep linting happy
        const tableName1 = res.names[0] as string;
        const tableName2 = res.names[1] as string;

        const noPermission = db2.batch([
          db2.prepare(
            `INSERT INTO ${tableName1} (id, name) VALUES (1, 'one');`
          ),
          db2.prepare(
            `INSERT INTO ${tableName2} (id, name) VALUES (2, 'two');`
          ),
        ]);

        await rejects(noPermission, function (err: any) {
          match(
            err.cause.message,
            /db query execution failed \(code: ACL, msg: not enough privileges\)/
          );
          return true;
        });

        // test after insert is granted
        const [batchGrant] = await db.batch([
          db.prepare(`GRANT INSERT ON ${tableName1} TO '${wallet.address}';`),
          db.prepare(`GRANT INSERT ON ${tableName2} TO '${wallet.address}';`),
        ]);
        // db has autoWait turned off
        await batchGrant.meta.txn?.wait();

        await db2.batch([
          db2.prepare(
            `INSERT INTO ${tableName1} (id, name) VALUES (1, 'one');`
          ),
          db2.prepare(
            `INSERT INTO ${tableName2} (id, name) VALUES (2, 'two');`
          ),
        ]);

        const results = await db2.batch([
          db2.prepare(`SELECT * FROM ${tableName1};`),
          db2.prepare(`SELECT * FROM ${tableName2};`),
        ]);

        strictEqual(results.length, 2);
        strictEqual(results[0].results.length, 1);
        strictEqual(results[1].results.length, 1);

        const table1 = results[0].results;
        const table2 = results[1].results;
        strictEqual(table1[0].id, 1);
        strictEqual(table1[0].name, "one");
        strictEqual(table2[0].id, 2);
        strictEqual(table2[0].name, "two");
      });

      // test after insert is revoked
      test("when doing grant with batch", async function () {
        // Need to make a lot of changes in this test, increase timeout
        this.timeout(TEST_TIMEOUT_FACTOR * 20000);

        const [batch] = await db.batch([
          db.prepare(`CREATE TABLE test_revoke_1 (id INTEGER, name TEXT);`),
          db.prepare(`CREATE TABLE test_revoke_2 (id INTEGER, name TEXT);`),
        ]);
        // db has autoWait turned off
        const res = await batch.meta.txn?.wait();

        match(res.names[0], /^test_revoke_1_31337_\d+$/);
        match(res.names[1], /^test_revoke_2_31337_\d+$/);

        // TODO: batch return types aren't setup, so using `as` to keep linting happy
        const tableName1 = res.names[0] as string;
        const tableName2 = res.names[1] as string;

        // test after insert is granted
        const [batchGrant] = await db.batch([
          db.prepare(`GRANT INSERT ON ${tableName1} TO '${wallet.address}';`),
          db.prepare(`GRANT INSERT ON ${tableName2} TO '${wallet.address}';`),
        ]);
        // db has autoWait turned off
        await batchGrant.meta.txn?.wait();

        await db2.batch([
          db2.prepare(
            `INSERT INTO ${tableName1} (id, name) VALUES (1, 'one');`
          ),
          db2.prepare(
            `INSERT INTO ${tableName2} (id, name) VALUES (2, 'two');`
          ),
        ]);

        const results = await db2.batch([
          db2.prepare(`SELECT * FROM ${tableName1};`),
          db2.prepare(`SELECT * FROM ${tableName2};`),
        ]);
        const table1 = results[0].results;
        const table2 = results[1].results;
        strictEqual(table1[0].id, 1);
        strictEqual(table1[0].name, "one");
        strictEqual(table2[0].id, 2);
        strictEqual(table2[0].name, "two");

        // test after insert is granted
        const [batchRevoke] = await db.batch([
          db.prepare(
            `REVOKE INSERT ON ${tableName1} FROM '${wallet.address}';`
          ),
          db.prepare(
            `REVOKE INSERT ON ${tableName2} FROM '${wallet.address}';`
          ),
        ]);
        // db has autoWait turned off
        await batchRevoke.meta.txn?.wait();

        const noPermission = db2.batch([
          db2.prepare(
            `INSERT INTO ${tableName1} (id, name) VALUES (1, 'one');`
          ),
          db2.prepare(
            `INSERT INTO ${tableName2} (id, name) VALUES (2, 'two');`
          ),
        ]);

        await rejects(noPermission, function (err: any) {
          match(
            err.cause.message,
            /db query execution failed \(code: ACL, msg: not enough privileges\)/
          );
          return true;
        });
      });
    });
  });

  describe(".exec()", function () {
    let tableName: string;
    this.beforeAll(async function () {
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
          // Note that we're checking error directly here to ensure out custom (postfix)
          // message is included
          err.message,
          /^EXEC_ERROR: error parsing statement: syntax error at position \d+ near 'INSERT'$/
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

      test("when querying a table right after creation", async function () {
        const { meta } = await db.exec(
          "CREATE TABLE exec_nowait (keyy TEXT, vall TEXT);"
        );
        const tableName = meta.txn?.name ?? "";
        match(tableName, /^exec_nowait_31337_\d+$/);

        const { results } = await db.exec(`SELECT * FROM ${tableName};`);
        deepStrictEqual(results, []);
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
