import fetch from "jest-fetch-mock";
import { connect, resultsToObjects, Connection } from "../src/main";
import {
  FetchReceiptExists,
  FetchSelectQuerySuccess,
  FetchInsertQuerySuccess,
  FetchUpdateQuerySuccess,
  FetchValidateWriteQuery,
  FetchSetControllerSuccess,
} from "../test/fauxFetch";

describe("read and write methods", function () {
  let connection: Connection;
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
    connection = connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
      chainId: 5,
    });
  });

  afterEach(function () {
    // ensure mocks don't bleed into other tests
    fetch.resetMocks();
  });

  test("returns RPC result when select query succeeds", async function () {
    fetch.mockResponseOnce(FetchSelectQuerySuccess);

    const res = await connection.read("SELECT * FROM test_1;");
    expect(res).toEqual({
      columns: [{ name: "colname" }],
      rows: [["val1"]],
    });
  });

  test("returns RPC result when insert query succeeds", async function () {
    fetch.mockResponseOnce(FetchInsertQuerySuccess);
    fetch.mockResponseOnce(FetchReceiptExists);

    const res = await connection.write(
      "INSERT INTO test_1 (colname) values (val2);"
    );
    expect(res).toEqual({ hash: "testhashinsertresponse" });
  });

  test("returns RPC result when update query succeeds", async function () {
    fetch.mockResponseOnce(FetchUpdateQuerySuccess);
    fetch.mockResponseOnce(FetchReceiptExists);

    const res = await connection.write(
      "UPDATE test_1 SET colname = val3 where colname = val2;"
    );
    expect(res).toEqual({ hash: "testhashinsertresponse" });
  });

  test("validates write query outside of actual transaction", async function () {
    fetch.mockResponseOnce(FetchValidateWriteQuery);

    const connection = await connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
      chainId: 5,
    });

    const { tableId } = await connection.validate(
      "INSERT INTO test_74613_1 (colname) values (val2);"
    );

    expect(tableId).toEqual(1);
  });

  test("write options enable not waiting to return until after confirmation", async function () {
    fetch.mockResponseOnce(FetchUpdateQuerySuccess);

    const res = await connection.write(
      "UPDATE test_1 SET colname = val3 where colname = val2;",
      { skipConfirm: true }
    );
    await expect(res).toEqual({ hash: "testhashinsertresponse" });
  });

  test("returns transaction receipt when contract is called directly", async function () {
    fetch.mockResponseOnce(FetchValidateWriteQuery);
    fetch.mockResponseOnce(FetchReceiptExists);

    const connection = connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
      rpcRelay: false,
    });

    const txReceipt = await connection.write(
      "INSERT INTO test_1 (colname) values (val2);"
    );

    expect(txReceipt.hash).toEqual("0x016");
  });

  test("maps arguments to correct RPC params", async function () {
    fetch.mockResponseOnce(FetchSelectQuerySuccess);

    const queryStaement = "SELECT * FROM test_1;";
    await connection.read(queryStaement);
    const payload = JSON.parse(fetch.mock.calls[0][1]?.body as string);

    expect(payload.params[0]?.statement).toEqual(queryStaement);
    expect(payload.params[0]).not.toHaveProperty("id");
    expect(payload.params[0]).not.toHaveProperty("create_statement");
  });

  test("returns RPC result when setting controller succeeds", async function () {
    fetch.mockResponseOnce(FetchSetControllerSuccess);

    const res = await connection.setController(
      "0xControllerContract",
      "prefix_74613_1"
    );
    expect(res).toEqual({ hash: "testhashsetcontrollerresponse" });
  });

  test("exports a function to map results to array of objects", async function () {
    expect(
      resultsToObjects({
        columns: [{ name: "col1" }, { name: "col2" }],
        rows: [
          ["val11", "val12"],
          ["val21", "val22"],
        ],
      })
    ).toEqual([
      {
        col1: "val11",
        col2: "val12",
      },
      {
        col1: "val21",
        col2: "val22",
      },
    ]);
  });
});
