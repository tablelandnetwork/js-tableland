import fetch from "jest-fetch-mock";
// import { ethers } from "./mock_modules/ethers";
import { connect } from "../src/main";
import {
  FetchCreateDryRunError,
  FetchCreateDryRunSuccess,
  FetchCreateTableOnTablelandSuccess,
} from "./fauxFetch";

describe("create method", function () {
  let connection: any;
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
    // const signer = ethers.providers.Web3Provider().getSigner();
    connection = await connect({
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
    fetch.mockResponseOnce(FetchCreateTableOnTablelandSuccess);

    const txReceipt = await connection.create("id int primary key, val text");
    expect(txReceipt.tableId._hex).toEqual("0x015");
  });

  test("Create table throws if dryrun fails", async function () {
    fetch.mockResponseOnce(FetchCreateDryRunError);
    fetch.mockResponseOnce(FetchCreateTableOnTablelandSuccess);

    await expect(async function () {
      await connection.create("id int primary key, val text", "123test");
    }).rejects.toThrow("TEST ERROR: invalid sql near 123");
  });
});
