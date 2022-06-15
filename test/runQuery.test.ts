import fetch from "jest-fetch-mock";
import { connect } from "../src/main";
import {
  FetchSelectQuerySuccess,
  FetchInsertQuerySuccess,
  FetchUpdateQuerySuccess,
} from "../test/fauxFetch";

describe("read and write methods", function () {
  let connection: any;
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
    connection = await connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
    });
  });

  afterEach(function () {
    // ensure mocks don't bleed into other tests
    fetch.resetMocks();
  });

  test("returns RPC result when select query succeeds", async function () {
    fetch.mockResponseOnce(FetchSelectQuerySuccess);

    const res = await connection.read("SELECT * FROM test_1;");
    await expect(res).toEqual({
      columns: [{ name: "colname" }],
      rows: ["val1"],
    });
  });

  test("returns RPC result when insert query succeeds", async function () {
    fetch.mockResponseOnce(FetchInsertQuerySuccess);

    const res = await connection.write(
      "INSERT INTO test_1 (colname) values (val2);"
    );
    await expect(res).toEqual({ hash: "testhashinsertresponse" });
  });

  test("returns RPC result when update query succeeds", async function () {
    fetch.mockResponseOnce(FetchUpdateQuerySuccess);

    const res = await connection.write(
      "UPDATE test_1 SET colname = val3 where colname = val2;"
    );
    await expect(res).toEqual({ hash: "testhashinsertresponse" });
  });

  test("maps arguments to correct RPC params", async function () {
    fetch.mockResponseOnce(FetchSelectQuerySuccess);

    const queryStaement = "SELECT * FROM test_1;";
    await connection.read(queryStaement);
    const payload = JSON.parse(fetch.mock.calls[0][1]?.body as string);

    await expect(payload.params[0]?.statement).toEqual(queryStaement);
    await expect(payload.params[0]).not.toHaveProperty("id");
    await expect(payload.params[0]).not.toHaveProperty("create_statement");
  });
});
