import test from "tape";
import { getAccounts } from "@tableland/local";
import { connect, Connection } from "../../src/main.js";
import { setup } from "./setupTest.js";

let tableName: string;
let connection: Connection;
test("controller methods: setup", async function (t) {
  await setup(t);

  const wallet = getAccounts()[2];
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
});

test("controller methods: setting controller succeeds", async function (t) {
  const res = await connection.setController(
    getAccounts()[10].address,
    tableName
  );
  t.equal(typeof res.hash, "string");
  t.equal(res.hash.length, 66);
});

test("controller methods: getting controller succeeds", async function (t) {
  const res = await connection.getController(tableName);
  t.equal(res, getAccounts()[10].address);
});

test("controller methods: locking controller succeeds", async function (t) {
  const res = await connection.lockController(tableName);
  t.equal(typeof res.hash, "string");
  t.equal(res.hash.length, 66);
});
