import test from "tape";
import { ethers } from "ethers";
import { getAccounts } from "@tableland/local";
import { connect, Connection } from "../../src/main.js";
import { setup } from "./setupTest.js";

let connection: Connection;
let tableName: string;
let tableId: string;
test("read and write methods: setup", async function (t) {
  await setup(t);

  const provider = new ethers.providers.JsonRpcProvider();
  const wallet = new ethers.Wallet(getAccounts()[17].privateKey, provider);
  connection = connect({
    chain: "local-tableland",
    signer: wallet,
  });

  const { name, tableId: id } = await connection.create("colname text", {
    prefix: "test",
  });
  if (typeof name !== "string") throw new Error("cannot get tablename");
  if (typeof id === "undefined") throw new Error("cannot get tableId");
  tableName = name;
  tableId = id.toString();
});

test("read and write methods: returns RPC result when insert query succeeds", async function (t) {
  const res = await connection.write(
    `INSERT INTO ${tableName} (colname) values ('val1');`
  );
  t.equal(typeof res.hash, "string");
  t.equal(res.hash.length, 66);
});

test("read and write methods: returns RPC result when select query succeeds", async function (t) {
  const res = await connection.read(`SELECT * FROM ${tableName};`);
  t.equal(res.columns.length, 1);
  t.equal(res.rows.length, 1);
  t.equal(res.columns[0].name, "colname");
  t.equal(res.rows[0][0], "val1");
});

test("read and write methods: returns RPC result when update query succeeds", async function (t) {
  const res = await connection.write(
    `UPDATE ${tableName} SET colname = 'val3' where colname = 'val1';`
  );
  t.equal(typeof res.hash, "string");
  t.equal(res.hash.length, 66);
});

test.skip("read and write methods: throws when update fails due to table constraint", async function (t) {
  let updateError = new Error();
  try {
    await connection.write(`INSERT INTO ${tableName} (colname) values (1);`);
  } catch (err) {
    console.log("TEST 1:", err);
    updateError = err as Error;
  }

  t.equal(updateError.message, "violated table constraint");
});

test("read and write methods: validates write query outside of actual transaction", async function (t) {
  const { tableId: id } = await connection.validate(
    `INSERT INTO ${tableName} (colname) values ('val2');`
  );

  t.equal(tableId, id);
});

test("read and write methods: write options enable not waiting to return until after confirmation", async function (t) {
  const res = await connection.write(
    `UPDATE ${tableName} SET colname = 'val4' where colname = 'val3';`,
    { skipConfirm: true }
  );
  t.equal(typeof res.hash, "string");
  t.equal(res.hash.length, 66);
});

test("read and write methods: returns transaction receipt when contract is called directly", async function (t) {
  const provider = new ethers.providers.JsonRpcProvider();
  const wallet = new ethers.Wallet(getAccounts()[17].privateKey, provider);
  const connection1 = connect({
    chain: "local-tableland",
    signer: wallet,
    rpcRelay: false,
  });

  const txReceipt = await connection1.write(
    `INSERT INTO ${tableName} (colname) values ('val5');`
  );

  t.equal(typeof txReceipt.hash, "string");
  t.equal(txReceipt.hash.length > 10, true);
});
