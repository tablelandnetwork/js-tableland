// /* eslint-disable @typescript-eslint/no-non-null-assertion */
import { match, notStrictEqual, rejects, strictEqual } from "assert";
import { describe, test } from "mocha";
import { getAccounts } from "@tableland/local";
import {
  getDefaultProvider,
  type MultiEventTransactionReceipt,
} from "../src/helpers/index.js";
import { getContractReceipt } from "../src/helpers/ethers.js";
import { wrapTransaction } from "../src/registry/utils.js";
import { Registry } from "../src/registry/index.js";

describe("registry", function () {
  this.timeout("15s");
  // Note that we're using the second account here
  const [, wallet, controller] = getAccounts();
  const provider = getDefaultProvider("http://127.0.0.1:8545");
  const signer = wallet.connect(provider);
  const reg = new Registry({ signer });

  test("when initialized via constructor", async function () {
    const reg = new Registry({ signer });
    strictEqual(reg.config.signer, signer);
  });

  test("when initialized via .forSigner()", async function () {
    const reg = await Registry.forSigner(signer);
    strictEqual(reg.config.signer, signer);
  });

  describe("controller", function () {
    let receipt: MultiEventTransactionReceipt;
    this.beforeAll(async function () {
      const tx = await reg.createTable({
        chainId: 31337,
        statement: "create table test_controller_31337 (id int, name text)",
      });

      receipt = await getContractReceipt(tx);
      notStrictEqual(receipt.tableIds[0], undefined);
      strictEqual(receipt.chainId, 31337);
    });

    test("regression: when a tx comes back without a chainId", async function () {
      const tx = await reg.createTable({
        chainId: 31337,
        statement: "create table test_no_chainid_31337 (id int, name text)",
      });
      tx.chainId = 0; // Wipe out chainId information, which can happen
      // with MetaMask if no provider is connected
      const wrapped = await wrapTransaction(reg.config, "test_no_chainid", tx);
      strictEqual(wrapped.chainId, 31337);
    });

    test("when setting the controller succeeds", async function () {
      const tx = await reg.setController({
        controller: controller.address,
        tableName: `test_controller_${receipt.chainId}_${receipt.tableIds[0]}`,
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
      const results = await reg.getController({
        chainId: receipt.chainId,
        tableId: receipt.tableIds[0],
      });
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
      const tx = await reg.lockController({
        chainId: receipt.chainId,
        tableId: receipt.tableIds[0],
      });
      const rec = await tx.wait();
      strictEqual(typeof rec.transactionHash, "string");
      strictEqual(rec.transactionHash.length, 66);

      // Try to set it back, should be locked now (and also not allowed)
      await rejects(
        reg.setController({
          controller: wallet.address,
          tableName: {
            chainId: receipt.chainId,
            tableId: receipt.tableIds[0],
          },
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
    let receipt: MultiEventTransactionReceipt;
    this.beforeAll(async function () {
      this.timeout("15s");
      const tx = await reg.createTable({
        chainId: 31337,
        statement: "create table test_ownership_31337 (id int, name text)",
      });
      receipt = await getContractReceipt(tx);
      notStrictEqual(receipt.tableIds[0], undefined);
      strictEqual(receipt.chainId, 31337);
    });

    test("when listing fails", async function () {
      const results = await reg.listTables(controller.address);
      // strictEqual(results.length, 0);
      strictEqual(
        results.includes({
          chainId: receipt.chainId,
          tableId: receipt.tableIds[0],
        }),
        false
      );
    });

    test("when listing succeeds", async function () {
      const results = await reg.listTables(/* defaults to wallet.address */);
      strictEqual(results.length > 0, true);
      strictEqual(
        results.some(({ tableId }) => tableId === receipt.tableIds[0]),
        true
      );
    });

    test("when transfer succeeds", async function () {
      const tx = await reg.safeTransferFrom({
        to: controller.address,
        tableName: {
          chainId: receipt.chainId,
          tableId: receipt.tableIds[0],
        },
      });
      const rec = await tx.wait();
      strictEqual(typeof rec.transactionHash, "string");
      strictEqual(rec.transactionHash.length, 66);
    });

    test("when transfer fails", async function () {
      await rejects(
        reg.safeTransferFrom({
          to: wallet.address,
          tableName: {
            chainId: receipt.chainId,
            tableId: receipt.tableIds[0],
          },
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

  describe("mutate()", function () {
    // CREATE TABLE test_exec (id integer primary key, counter integer, info text)
    let receipt: MultiEventTransactionReceipt;
    this.beforeAll(async function () {
      this.timeout("15s");
      const tx = await reg.create({
        chainId: 31337,
        statement:
          "create table test_runsql_31337 (id integer primary key, counter integer, info text)",
      });
      receipt = await getContractReceipt(tx);
      notStrictEqual(receipt.tableIds[0], undefined);
      strictEqual(receipt.chainId, 31337);
    });
    test("when insert statement is valid", async function () {
      const tx = await reg.mutate({
        chainId: receipt.chainId,
        tableId: receipt.tableIds[0],
        statement: `INSERT INTO test_runsql_${receipt.chainId}_${receipt.tableIds[0]} (counter, info) VALUES (1, 'Tables');`,
      });
      const rec = await tx.wait();
      strictEqual(typeof rec.transactionHash, "string");
      strictEqual(rec.transactionHash.length, 66);
    });

    test("when insert statement is valid", async function () {
      const tx = await reg.mutate({
        chainId: receipt.chainId,
        tableId: receipt.tableIds[0],
        statement: `UPDATE test_runsql_${receipt.chainId}_${receipt.tableIds[0]} SET counter=2`,
      });
      const rec = await tx.wait();
      strictEqual(typeof rec.transactionHash, "string");
      strictEqual(rec.transactionHash.length, 66);
    });
  });

  describe(" *deprecated* runSQL()", function () {
    // CREATE TABLE test_exec (id integer primary key, counter integer, info text)
    let receipt: MultiEventTransactionReceipt;
    this.beforeAll(async function () {
      this.timeout("15s");
      const tx = await reg.createTable({
        chainId: 31337,
        statement:
          "create table test_runsql_31337 (id integer primary key, counter integer, info text)",
      });
      receipt = await getContractReceipt(tx);
      notStrictEqual(receipt.tableIds[0], undefined);
      strictEqual(receipt.chainId, 31337);
    });
    test("when insert statement is valid", async function () {
      const tx = await reg.runSQL({
        chainId: receipt.chainId,
        tableId: receipt.tableIds[0],
        statement: `INSERT INTO test_runsql_${receipt.chainId}_${receipt.tableIds[0]} (counter, info) VALUES (1, 'Tables');`,
      });
      const rec = await tx.wait();
      strictEqual(typeof rec.transactionHash, "string");
      strictEqual(rec.transactionHash.length, 66);
    });

    test("when insert statement is valid", async function () {
      const tx = await reg.runSQL({
        chainId: receipt.chainId,
        tableId: receipt.tableIds[0],
        statement: `UPDATE test_runsql_${receipt.chainId}_${receipt.tableIds[0]} SET counter=2`,
      });
      const rec = await tx.wait();
      strictEqual(typeof rec.transactionHash, "string");
      strictEqual(rec.transactionHash.length, 66);
    });
  });
});
