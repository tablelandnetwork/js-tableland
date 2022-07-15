import fetch from "jest-fetch-mock";
import { connect } from "../src/main";
import { FetchReceiptExists, FetchReceiptNone } from "./fauxFetch";

describe("has method", function () {
  let connection: any;
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
    connection = connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
    });
  });

  afterEach(function () {
    // ensure mocks don't bleed into other tests
    fetch.resetMocks();
  });

  test("Can get receipt of a processed transaction", async function () {
    fetch.mockResponseOnce(FetchReceiptExists);

    const receipt = await connection.receipt("0x017");

    // test that faux response makes it through
    await expect(receipt).toEqual({
      chainId: 5,
      txnHash: "0xc3e7d1e81b59556f414a5f5c23760eb61b4bfaa18150d924d7d3b334941dbecd",
      blockNumber: 1000,
      tableId: '2'
    });
  });

  test("Returns undefined for unprocessed transaction", async function () {
    fetch.mockResponseOnce(FetchReceiptNone);

    const receipt = await connection.receipt("0x017");

    // test that faux response makes it through
    await expect(receipt).toEqual(undefined);
  });

});
