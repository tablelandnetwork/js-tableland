import fetch from "jest-fetch-mock";
// import { ethers } from "./mock_modules/ethers";
import { connect } from "../src/main";
import {
  FetchCreateDryRunError,
  FetchCreateDryRunSuccess,
  FetchReceiptExists,
  FetchReceiptNone,
} from "./fauxFetch";

describe("create method", function () {
  let connection: any;
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
    // const signer = ethers.providers.Web3Provider().getSigner();
    connection = connect({
      network: "testnet",
      host: "https://testnetv2.tableland.network",
    });
  });

  afterEach(function () {
    // ensure mocks don't bleed into other tests
    fetch.resetMocks();
  });

  test("Create table works", async function () {
    fetch.mockResponseOnce(FetchCreateDryRunSuccess);
    fetch.mockResponseOnce(FetchReceiptExists);

    const txReceipt = await connection.create("id int primary key, val text");
    await expect(txReceipt.tableId._hex).toEqual("0x015");
  });

  test("Create table throws if dryrun fails", async function () {
    fetch.mockResponseOnce(FetchCreateDryRunError);
    fetch.mockResponseOnce(FetchReceiptExists);

    await expect(async function () {
      await connection.create("id int primary key, val text", {
        prefix: "123test",
      });
    }).rejects.toThrow("TEST ERROR: invalid sql near 123");
  });

  test("Create table waits to return until after confirmation", async function () {
    fetch.mockResponseOnce(FetchCreateDryRunSuccess);
    fetch.mockResponseOnce(FetchReceiptNone);
    fetch.mockResponseOnce(FetchReceiptExists);

    const txReceipt = await connection.create("id int primary key, val text");
    await expect(txReceipt.tableId._hex).toEqual("0x015");
  });

  test("Create table options enable not waiting to return until after confirmation", async function () {
    fetch.mockResponseOnce(FetchCreateDryRunSuccess);

    const txReceipt = await connection.create("id int primary key, val text", {
      skipConfirm: true,
    });
    await expect(txReceipt.tableId._hex).toEqual("0x015");
  });

  test("Create table options enable setting timeout for confirmation", async function () {
    fetch.mockResponseOnce(FetchCreateDryRunSuccess);
    fetch.mockResponseOnce(FetchReceiptNone);
    fetch.mockResponseOnce(FetchReceiptNone);
    fetch.mockResponseOnce(FetchReceiptNone);

    await expect(async function () {
      await connection.create("id int primary key, val text", {
        timeout: 2000 /* 2 seconds */,
      });
    }).rejects.toThrow(/timeout exceeded: could not get transaction receipt:/);
  }, 5000 /* 5 seconds */);
});
