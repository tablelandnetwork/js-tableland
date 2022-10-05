import test from "tape";
import { ethers } from "ethers";
import { getAccounts } from "@tableland/local";
import { connect, Connection } from "../../src/main.js";
import { setup } from "./setupTest.js";

let connection: Connection;
test("hash method: setup", async function (t) {
  await setup(t);

  const provider = new ethers.providers.JsonRpcProvider();
  const wallet = new ethers.Wallet(getAccounts()[4].privateKey, provider);
  connection = connect({
    chain: "local-tableland",
    signer: wallet,
  });
});

test("hash method: Hashing a table works", async function (t) {
  const schema = "id int primary key, val text";
  const prefix = "hello";
  const hashResponse = await connection.hash(schema, { prefix });

  t.equal(
    hashResponse.structureHash,
    "07c04291a6e489c27b7b2c03cfa535a2d5f91220ed0e0aacba93cef635501455"
  );
});

test("hash method: Hashing a table throws if statement is not valid", async function (t) {
  let hashError = new Error();
  try {
    await connection.hash("(id int primary key, val text);", {
      prefix: "123hello}",
    });
  } catch (err) {
    hashError = err as Error;
  }

  t.equal(
    hashError.message,
    "calling ValidateCreateTable parsing create table statement: unable to parse the query: syntax error at position 16 near '123'"
  );
});
