import fetch from "jest-fetch-mock";
import { connect } from "../src/main";
import {
  FetchRunQueryError,
  FetchSelectQuerySuccess,
  FetchInsertQuerySuccess,
  FetchUpdateQuerySuccess
} from "../test/fauxFetch";

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

  test("returns RPC result when select query succeeds", async function () {
    fetch.mockResponseOnce(FetchSelectQuerySuccess);

    const res = await connection.query("SELECT * FROM test_1;");
    await expect(res).toEqual({columns: ["colname"], rows: ["val1"]});
  });

  test("returns RPC result when insert query succeeds", async function () {
    fetch.mockResponseOnce(FetchInsertQuerySuccess);

    const res = await connection.query("INSERT INTO test_1 (colname) values (val2);");
    await expect(res).toEqual({data: null});
  });

  test("returns RPC result when update query succeeds", async function () {
    fetch.mockResponseOnce(FetchUpdateQuerySuccess);

    const res = await connection.query("UPDATE test_1 SET colname = val3 where colname = val2;");
    await expect(res).toEqual({data: null});
  });

  test("is case insensitive", async function () {
    fetch.mockResponseOnce(FetchSelectQuerySuccess);

    const res1 = await connection.query("select * from test_1;");
    await expect(res1).toEqual({columns: ["colname"], rows: ["val1"]});

    fetch.mockResponseOnce(FetchSelectQuerySuccess);

    const res2 = await connection.query("sELEct * frOM test_1;");
    await expect(res2).toEqual({columns: ["colname"], rows: ["val1"]});
  });

  test("parses tablename regardless of whitespace", async function () {
    fetch.mockResponseOnce(FetchSelectQuerySuccess);

    const res1 = await connection.query("INSERT INTO test_1(colname) Values ('val6');");
    await expect(res1).toEqual({columns: ["colname"], rows: ["val1"]});

    fetch.mockResponseOnce(FetchSelectQuerySuccess);

    const res2 = await connection.query("sELEct * frOM test_1;");
    await expect(res2).toEqual({columns: ["colname"], rows: ["val1"]});
  });

  test("parses tablename when inside double-quotes", async function () {
    fetch.mockResponseOnce(FetchSelectQuerySuccess);

    const res1 = await connection.query("INSERT INTO \"test_1\" (colname) Values ('val6');");
    await expect(res1).toEqual({columns: ["colname"], rows: ["val1"]});

    fetch.mockResponseOnce(FetchSelectQuerySuccess);

    const res2 = await connection.query("sELEct * frOM test_1;");
    await expect(res2).toEqual({columns: ["colname"], rows: ["val1"]});
  });

  test("throws error when query tablename is invalid", async function () {
    fetch.mockResponseOnce(FetchRunQueryError);

    await expect(async function () {
      await connection.query("SELECT * FROM test;");
    }).rejects.toThrow("No ID found in query. Remember to add the table's ID after it's name. Ex; TableName_0000");
  });

  test("throws error when query has no tablename identifier", async function () {
    fetch.mockResponseOnce(FetchRunQueryError);

    await expect(async function () {
      await connection.query("SELECT 1, 2, 3;");
    }).rejects.toThrow(
      "No table name identifier found in query. Tableland does not support sql statements that do not include a"
      + " specific table name identifier."
    );
  });

  test("throws error when query contains multiple statements", async function () {
    fetch.mockResponseOnce(FetchInsertQuerySuccess);

    await expect(async function () {
      await connection.query("INSERT INTO test_1 (colname) values (val4); INSERT INTO test_1 (colname) values (val5);");
    }).rejects.toThrow(
      "Invalid statement found in query. A Tableland query must be a single statement ending with a semicolon."
    );
  });
});
