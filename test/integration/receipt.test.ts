import test from "tape";
import { ethers } from "ethers";
import { getAccounts } from "@tableland/local";
import { connect } from "../../src/main.js";
import { setup } from "./setupTest.js";

let connection: any;
test("receipt method: setup", async function (t) {
  await setup(t);

  const provider = new ethers.providers.JsonRpcProvider();
  const wallet = new ethers.Wallet(getAccounts()[17].privateKey, provider);
  connection = connect({
    chain: "local-tableland",
    signer: wallet,
  });
});

test("receipt method: Can get receipt of a processed transaction", async function (t) {
  const { txnHash } = await connection.create("a int");
  const receipt = await connection.receipt(txnHash);

  t.equal(receipt.chainId, 31337);
  t.equal(receipt.txnHash, txnHash);
  t.equal(typeof receipt.blockNumber, "number");
  t.equal(typeof receipt.tableId, "string");
});

test("receipt method: Returns undefined for unprocessed transaction", async function (t) {
  const receipt = await connection.receipt(
    "0x0000000000adf2ed24c61bd0d2f52bef11fca7f0d7e5a703a1e58a7fb2958d0e"
  );

  t.equal(receipt, undefined);
});
