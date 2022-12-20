// /* eslint-disable @typescript-eslint/no-non-null-assertion */
import { match, notStrictEqual, rejects, strictEqual } from "assert";
import { describe, test } from "mocha";
import { getAccounts } from "@tableland/local";
// import { NonceManager } from "@ethersproject/experimental";
import {
  overrideDefaults,
  getDefaultProvider,
  RegistryReceipt,
} from "../src/helpers/index.js";
import { getContractReceipt } from "../src/helpers/ethers.js";
import { Registry } from "../src/registry/index.js";

overrideDefaults("localhost", {
  contractAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
});

describe("registry", function () {
  // Note that we're using the second account here
  const [, wallet, controller] = getAccounts();
  const provider = getDefaultProvider("http://127.0.0.1:8545");
  // const baseSigner = wallet.connect(provider);
  const signer = wallet.connect(provider);
  // Also demonstrates the nonce manager usage
  // const signer = new NonceManager(baseSigner);
  const reg = new Registry({ signer });

  describe("controller", function () {
    let receipt: RegistryReceipt;
    this.beforeAll(async function () {
      this.timeout("10s");
      const tx = await reg.createTable({
        chainId: 31337,
        statement: "create table test_controller_31337 (id int, name text)",
      });
      receipt = await getContractReceipt(tx);
      notStrictEqual(receipt.tableId, undefined);
      strictEqual(receipt.chainId, 31337);
    });

    test("when setting the controller succeeds", async function () {
      const tx = await reg.setController({
        controller: controller.address,
        tableName: `test_controller_${receipt.chainId}_${receipt.tableId}`,
      });
      const rec = await tx.wait();
      strictEqual(typeof rec.transactionHash, "string");
      strictEqual(rec.transactionHash.length, 66);
    });

    test("when setting the controller fails", async function () {
      await rejects(
        reg.setController({
          controller: controller.address,
          tableName: { chainId: 31337, tableId: "0" },
        }),
        (err: any) => {
          match(
            err.message,
            // Actual hidden error:
            // reverted with custom error 'OwnerQueryForNonexistentToken()'
            /cannot estimate gas; transaction may fail or may require manual gas limit.*/
          );
          return true;
        }
      );
    });

    test("when getting the controller succeeds", async function () {
      const results = await reg.getController(receipt);
      strictEqual(results, controller.address);
    });

    test("when getting the controller for a missing table", async function () {
      const results = await reg.getController({
        chainId: 31337,
        tableId: "0",
      });
      strictEqual(results, "0x0000000000000000000000000000000000000000");
    });

    test("when getting the controller fails", async function () {
      await rejects(
        reg.getController({ chainId: 31337, tableId: "-1" }),
        (err: any) => {
          match(err.message, /value out-of-bounds.*/);
          return true;
        }
      );
    });

    test("when locking the controller fails", async function () {
      await rejects(
        reg.lockController({ chainId: 31337, tableId: "0" }),
        (err: any) => {
          match(
            err.message,
            // Actual hidden error:
            // reverted with custom error 'OwnerQueryForNonexistentToken()'
            /cannot estimate gas; transaction may fail or may require manual gas limit.*/
          );
          return true;
        }
      );
    });

    test("when locking the controller succeeds", async function () {
      const tx = await reg.lockController(receipt);
      const rec = await tx.wait();
      strictEqual(typeof rec.transactionHash, "string");
      strictEqual(rec.transactionHash.length, 66);

      // Try to set it back, should be locked now (and also not allowed)
      await rejects(
        reg.setController({
          controller: wallet.address,
          tableName: receipt,
        }),
        (err: any) => {
          match(
            err.message,
            // Actual hidden error:
            // reverted with custom error 'Unauthorized()'
            /cannot estimate gas; transaction may fail or may require manual gas limit.*/
          );
          return true;
        }
      );
    });
  });

  describe("list and transfer", function () {
    let receipt: RegistryReceipt;
    this.beforeAll(async function () {
      this.timeout("10s");
      const tx = await reg.createTable({
        chainId: 31337,
        statement: "create table test_ownership_31337 (id int, name text)",
      });
      receipt = await getContractReceipt(tx);
      notStrictEqual(receipt.tableId, undefined);
      strictEqual(receipt.chainId, 31337);
    });

    test("when listing fails", async function () {
      const results = await reg.listTables(controller.address);
      // strictEqual(results.length, 0);
      strictEqual(results.includes(receipt), false);
    });

    test("when listing succeeds", async function () {
      const results = await reg.listTables(/* defaults to wallet.address */);
      strictEqual(results.length > 0, true);
      strictEqual(
        results.some(({ tableId }) => tableId === receipt.tableId),
        true
      );
    });

    test("when transfer succeeds", async function () {
      const tx = await reg.safeTransferFrom({
        to: controller.address,
        tableName: receipt,
      });
      const rec = await tx.wait();
      strictEqual(typeof rec.transactionHash, "string");
      strictEqual(rec.transactionHash.length, 66);
    });

    test("when transfer fails", async function () {
      await rejects(
        reg.safeTransferFrom({
          to: wallet.address,
          tableName: receipt,
        }),
        (err: any) => {
          match(
            err.message,
            // Actual hidden error:
            // reverted with custom error 'TransferFromIncorrectOwner()'
            /cannot estimate gas; transaction may fail or may require manual gas limit.*/
          );
          return true;
        }
      );
    });
  });

  describe("runSQL()", function () {
    // CREATE TABLE test_exec (id integer primary key, counter integer, info text)
    let receipt: RegistryReceipt;
    this.beforeAll(async function () {
      this.timeout("10s");
      const tx = await reg.createTable({
        chainId: 31337,
        statement:
          "create table test_runsql_31337 (id integer primary key, counter integer, info text)",
      });
      receipt = await getContractReceipt(tx);
      notStrictEqual(receipt.tableId, undefined);
      strictEqual(receipt.chainId, 31337);
    });
    test("when insert statement is valid", async function () {
      const tx = await reg.runSQL({
        ...receipt,
        statement: `INSERT INTO test_runsql_${receipt.chainId}_${receipt.tableId} (counter, info) VALUES (1, 'Tables');`,
      });
      const rec = await tx.wait();
      strictEqual(typeof rec.transactionHash, "string");
      strictEqual(rec.transactionHash.length, 66);
    });

    test("when insert statement is valid", async function () {
      const tx = await reg.runSQL({
        ...receipt,
        statement: `UPDATE test_runsql_${receipt.chainId}_${receipt.tableId} SET counter=2`,
      });
      const rec = await tx.wait();
      strictEqual(typeof rec.transactionHash, "string");
      strictEqual(rec.transactionHash.length, 66);
    });
  });
});
