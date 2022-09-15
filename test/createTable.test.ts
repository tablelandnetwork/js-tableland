import { connect } from "../src/main";
import { ethers } from "ethers";
import { LocalTableland } from "@tableland/local";

describe("create method", function () {
  let connection: any;
  let localNode: any;
  beforeAll(async function () {
    localNode = new LocalTableland({
      validatorDir: "../../go-tableland",
      registryDir: "../../evm-tableland"
    });

    await localNode.start();

    const provider = new ethers.providers.JsonRpcProvider();
    const signer = provider.getSigner();
    connection = connect({
      chain: "local-tableland",
      signer
    });
  });

  test("Create table works", async function () {
    const txReceipt = await connection.create("id int primary key, val text");
    expect(txReceipt.tableId._hex).toEqual("0x015");
  });

  test("Create table throws if dryrun fails", async function () {
    await expect(async function () {
      await connection.create("id int primary key, val text", {
        prefix: "123test",
      });
    }).rejects.toThrow("TEST ERROR: invalid sql near 123");
  });

  test("Create table waits to return until after confirmation", async function () {
    const txReceipt = await connection.create("id int primary key, val text");
    expect(txReceipt.tableId._hex).toEqual("0x015");
  });

  test("Create table options enable not waiting to return until after confirmation", async function () {
    const txReceipt = await connection.create("id int primary key, val text", {
      skipConfirm: true,
    });
    expect(txReceipt.tableId._hex).toEqual("0x015");
  });

  test("Create table options enable setting timeout for confirmation", async function () {
    await expect(async function () {
      await connection.create("id int primary key, val text", {
        timeout: 2000 /* 2 seconds */,
      });
    }).rejects.toThrow(/timeout exceeded: could not get transaction receipt:/);
  }, 5000 /* 5 seconds */);
});
