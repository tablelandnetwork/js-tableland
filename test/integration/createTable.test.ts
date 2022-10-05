import test from "tape";
import { getAccounts } from "@tableland/local";
import { connect } from "../../src/main.js";
import { ethers } from "ethers";
import { setup } from "./setupTest.js";

let connection: any;
// Starting the local network takes quite a while
test("create method: setup", async function (t) {
  await setup(t);

  const provider = new ethers.providers.JsonRpcProvider();
  const wallet = new ethers.Wallet(getAccounts()[1].privateKey, provider);
  connection = connect({
    chain: "local-tableland",
    signer: wallet,
  });
});

test("create method: Creating table works", async function (t) {
  const txReceipt = await connection.create("id int primary key, val text");

  t.equal(!!txReceipt.tableId._hex.match(/^0x0[1-9]/), true);
});

test("create method: Creating table throws if validation fails", async function (t) {
  let createError = new Error();
  try {
    await connection.create("id int primary key, val text", {
      prefix: "123test",
    });
  } catch (err) {
    createError = err as Error;
  }

  t.equal(
    createError.message,
    "calling ValidateCreateTable parsing create table statement: unable to parse the query: syntax error at position 16 near '123'"
  );
});

test("create method: Creating table accepts skipConfirm option", async function (t) {
  const txReceipt = await connection.create("id int primary key, val text", {
    skipConfirm: true,
  });
  t.equal(!!txReceipt.tableId._hex.match(/^0x0[1-9]/), true);
});
