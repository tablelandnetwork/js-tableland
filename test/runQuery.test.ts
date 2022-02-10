import fetch from "jest-fetch-mock";
import { connect } from "../src/main";
import { FetchRunQueryError, FetchRunQuerySuccess } from "../test/fauxFetch";

describe("query method", function () {
  let connection: any;
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
    connection = await connect({ network: "testnet", host: "https://testnet.tableland.network" });
  });

  afterEach(function () {
    // ensure mocks don't bleed into other tests
    fetch.resetMocks();
  });

  test("returns RPC result when request succeeds", async function () {
    fetch.mockResponseOnce(FetchRunQuerySuccess);

    const res = await connection.query("SELECT * FROM test_1;");
    await expect(res).toEqual({columns: ["colname"], rows: ["val1"]});
  });

  test("throws RPC error when request query tablename is invalid", async function () {
    fetch.mockResponseOnce(FetchRunQueryError);

    await expect(async function () {
      await connection.query("SELECT * FROM test;");
    }).rejects.toThrow("TEST ERROR: table name has wrong format");
  });

});
