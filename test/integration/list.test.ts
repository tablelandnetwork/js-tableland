import test from "tape";
import { ethers } from "ethers";
import { getAccounts } from "@tableland/local";
import { connect } from "../../src/main.js";
import { setup } from "./setupTest.js";

let connection: any;
test("list method: setup", async function (t) {
  await setup(t);

  const provider = new ethers.providers.JsonRpcProvider();
  const wallet = new ethers.Wallet(getAccounts()[0].privateKey, provider);
  connection = connect({
    chain: "local-tableland",
    signer: wallet,
  });
});

test("list method: When I fetch my tables, I get some tables", async function (t) {
  const resp = await connection.list();
  const table = resp[0];

  t.equal(table.name, "healthbot_31337_1");
  t.equal(typeof table.structure, "string");
  t.equal(table.structure.length, 64);
});

// TODO: need to get a second connection for wallet without any tables
test.skip("list method: If I have no tables, I get empty Array", async function (t) {
  const provider = new ethers.providers.JsonRpcProvider();
  const wallet = new ethers.Wallet(getAccounts()[18].privateKey, provider);
  const connection1 = connect({
    chain: "local-tableland",
    signer: wallet,
  });
  const resp = await connection1.list();

  t.equal(resp, []);
});
