import url from "node:url";
import path from "node:path";
import fs from "node:fs";
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { strictEqual, rejects } from "assert";
import { describe, test } from "mocha";
import { getAccounts } from "@tableland/local";
import {
  type NameMapping,
  getDefaultProvider,
  jsonFileAliases,
} from "../src/helpers/index.js";
import { Database } from "../src/index.js";
import { TEST_TIMEOUT_FACTOR } from "./setup";

/* eslint-disable @typescript-eslint/naming-convention */
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

describe("aliases", function () {
  this.timeout(TEST_TIMEOUT_FACTOR * 10000);
  // Note that we're using the second account here
  const [, wallet] = getAccounts();
  const provider = getDefaultProvider("http://127.0.0.1:8545");
  const signer = wallet.connect(provider);

  describe("in memory aliases", function () {
    // keeping name mappings in memory during these tests, but in practice
    // this map needs to be persisted for the entire life of the aliases
    const nameMap: NameMapping = {};

    const db = new Database({
      signer,
      // this parameter is the core of the aliases feature
      aliases: {
        read: async function () {
          return nameMap;
        },
        write: async function (names) {
          for (const uuTableName in names) {
            nameMap[uuTableName] = names[uuTableName];
          }
        },
      },
    });

    test("running create statement adds name to aliases", async function () {
      const tablePrefix = "aliases_table";
      const { meta } = await db
        .prepare(`CREATE TABLE ${tablePrefix} (counter int, info text);`)
        .all();
      const uuTableName = meta.txn?.name ?? "";

      strictEqual(nameMap[tablePrefix], uuTableName);
    });

    test("insert and select uses aliases table name mappings", async function () {
      await db
        .prepare(
          "CREATE TABLE students (first_name text, last_name text);"
          // testing`first` here
        )
        .first();

      const { meta } = await db
        .prepare(
          "INSERT INTO students (first_name, last_name) VALUES ('Bobby', 'Tables');"
          // testing`run` here
        )
        .run();

      await meta.txn?.wait();

      const { results } = await db
        .prepare(
          `SELECT * FROM students;`
          // testing `all` here
          // with 'run' and 'first' above this touches all of the single statement methods
        )
        .all<{ first_name: string; last_name: string }>();

      strictEqual(results.length, 1);
      strictEqual(results[0].first_name, "Bobby");
      strictEqual(results[0].last_name, "Tables");
    });

    test("batch create uses aliases table name mappings", async function () {
      const prefixes = ["batch_table1", "batch_table2", "batch_table3"];

      const [{ meta }] = await db.batch([
        db.prepare(`CREATE TABLE ${prefixes[0]} (counter int, info text);`),
        db.prepare(`CREATE TABLE ${prefixes[1]} (counter int, info text);`),
        db.prepare(`CREATE TABLE ${prefixes[2]} (counter int, info text);`),
      ]);

      const uuNames = meta.txn?.names ?? [];

      strictEqual(nameMap[prefixes[0]], uuNames[0]);
      strictEqual(nameMap[prefixes[1]], uuNames[1]);
      strictEqual(nameMap[prefixes[2]], uuNames[2]);
    });

    test("batch mutate uses aliases table name mappings", async function () {
      await db.prepare("CREATE TABLE mutate_test (k text, val text);").first();

      const [{ meta }] = await db.batch([
        db.prepare(
          "INSERT INTO mutate_test (k, val) VALUES ('token1', 'asdfgh');"
        ),
        db.prepare(
          "INSERT INTO mutate_test (k, val) VALUES ('token2', 'qwerty');"
        ),
        db.prepare(
          "INSERT INTO mutate_test (k, val) VALUES ('token3', 'zxcvbn');"
        ),
      ]);

      await meta.txn?.wait();

      const { results } = await db
        .prepare(`SELECT * FROM mutate_test;`)
        .all<{ k: string; val: string }>();

      strictEqual(results.length, 3);
      strictEqual(results[0].k, "token1");
      strictEqual(results[1].k, "token2");
      strictEqual(results[2].k, "token3");
      strictEqual(results[0].val, "asdfgh");
      strictEqual(results[1].val, "qwerty");
      strictEqual(results[2].val, "zxcvbn");
    });

    test("batch select uses aliases table name mappings", async function () {
      const prefixes = ["batch_select1", "batch_select2", "batch_select3"];

      await db.batch([
        db.prepare(`CREATE TABLE ${prefixes[0]} (counter int);`),
        db.prepare(`CREATE TABLE ${prefixes[1]} (counter int);`),
        db.prepare(`CREATE TABLE ${prefixes[2]} (counter int);`),
      ]);

      const [{ meta }] = await db.batch([
        db.prepare(`INSERT INTO ${prefixes[0]} (counter) VALUES (1);`),
        db.prepare(`INSERT INTO ${prefixes[1]} (counter) VALUES (2);`),
        db.prepare(`INSERT INTO ${prefixes[2]} (counter) VALUES (3);`),
      ]);

      await meta.txn?.wait();

      const results = await db.batch<{ counter: number }>([
        db.prepare(`SELECT * FROM ${prefixes[0]};`),
        db.prepare(`SELECT * FROM ${prefixes[1]};`),
        db.prepare(`SELECT * FROM ${prefixes[2]};`),
      ]);

      strictEqual(results.length, 3);
      strictEqual(results[0].results.length, 1);
      strictEqual(results[1].results.length, 1);
      strictEqual(results[2].results.length, 1);
      strictEqual(results[0].results[0].counter, 1);
      strictEqual(results[1].results[0].counter, 2);
      strictEqual(results[2].results[0].counter, 3);
    });

    test("using universal unique table name works with aliases", async function () {
      const { meta } = await db
        .prepare("CREATE TABLE uu_name (counter int);")
        .all();
      const uuTableName = meta.txn?.name ?? "";

      const { meta: insertMeta } = await db
        .prepare(`INSERT INTO ${uuTableName} (counter) VALUES (1);`)
        .all();

      await insertMeta.txn?.wait();

      const { results } = await db
        .prepare(`SELECT * FROM ${uuTableName};`)
        .all<{ counter: number }>();

      strictEqual(results.length, 1);
      strictEqual(results[0].counter, 1);
    });

    test("creating a table with an existing prefix throws", async function () {
      const tablePrefix = "duplicate_name";
      await db
        .prepare(`CREATE TABLE ${tablePrefix} (counter int, info text);`)
        .all();

      await rejects(
        db
          .prepare(`CREATE TABLE ${tablePrefix} (counter int, info text);`)
          .all(),
        "table name already exists in aliases"
      );
    });
  });

  describe("json file aliases", function () {
    const aliasesDir = path.join(__dirname, "aliases");
    const aliasesFile = path.join(aliasesDir, "json-file-aliases.json");
    try {
      fs.mkdirSync(aliasesDir);
    } catch (err) {}
    // reset the aliases file, and ensure the helper
    // creates the file if it doesn't exist
    try {
      fs.unlinkSync(aliasesFile);
    } catch (err) {}

    const db = new Database({
      signer,
      // use the built-in SDK helper to setup and manage json aliases files
      aliases: jsonFileAliases(aliasesFile),
    });

    this.afterAll(function () {
      try {
        fs.unlinkSync(aliasesFile);
      } catch (err) {}
    });

    test("running create statement adds name to aliases", async function () {
      const tablePrefix = "json_aliases_table";
      const { meta } = await db
        .prepare(`CREATE TABLE ${tablePrefix} (counter int, info text);`)
        .all();

      const uuTableName = meta.txn?.name ?? "";
      const nameMap = (await db.config.aliases?.read()) ?? {};

      strictEqual(nameMap[tablePrefix], uuTableName);
    });
  });
});
