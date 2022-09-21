import { connect } from "../src/main";
import { ethers } from "ethers";
import { LocalTableland } from "@tableland/local";

describe("create method", function () {
  let connection: any;
  let localNode: any;

  // Starting the local network takes quite a while
  jest.setTimeout(200 * 1000);
  beforeAll(function (done) {

    localNode = new LocalTableland({
      validatorDir: "../go-tableland",
      registryDir: "../evm-tableland",
      //silent: true
    });

    localNode.start();

    localNode.initEmitter.on("validator ready", function () {
      console.log("local node started");
      const provider = new ethers.providers.JsonRpcProvider();
      const signer = provider.getSigner();
      connection = connect({
        chain: "local-tableland",
        signer
      });

      done();
    });
  });

  afterAll(async function () {
    localNode.shutdown(true);
    await new Promise(function (resolve) {
      setTimeout(() => resolve(1), 3000);
    });
  });

  test("Create table works", async function () {
    const txReceipt = await connection.create("id int primary key, val text");
    expect(txReceipt.tableId._hex).toEqual("0x02");
  });

  test("Create table throws if validation fails", async function () {
    await expect(async function () {
      await connection.create("id int primary key, val text", {
        prefix: "123test",
      });
    }).rejects.toThrow(
      "calling ValidateCreateTable parsing create table statement: unable to parse the query: syntax error at position 16 near '123'"
    );
  });

  test("Create table waits to return until after confirmation", async function () {
    const txReceipt = await connection.create("id int primary key, val text");
    expect(txReceipt.tableId._hex).toEqual("0x03");
  });

  test("Create table options enable not waiting to return until after confirmation", async function () {
    const txReceipt = await connection.create("id int primary key, val text", {
      skipConfirm: true,
    });
    expect(txReceipt.tableId._hex).toEqual("0x04");
  });

  // TODO: can't think of a way to do this test without mocks
  test.skip("Create table options enable setting timeout for confirmation", async function () {
    await expect(async function () {
      await connection.create("id int primary key, val text", {
        timeout: 2000 /* 2 seconds */,
      });
    }).rejects.toThrow(/timeout exceeded: could not get transaction receipt:/);
  }, 5000 /* 5 seconds */);
});
