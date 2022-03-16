import fetch from "jest-fetch-mock";
import { connect } from "../src/main";
import {
  FetchAuthorizedListSuccess,
  FetchCreateDryRunError,
  FetchCreateDryRunSuccess,
  FetchCreateTableOnTablelandSuccess,
} from "./fauxFetch";

describe("create method", function () {
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

  test("Create table works", async function () {
    fetch.mockResponseOnce(FetchAuthorizedListSuccess);
    fetch.mockResponseOnce(FetchCreateDryRunSuccess);
    fetch.mockResponseOnce(FetchCreateTableOnTablelandSuccess);

    const createStatement = "CREATE TABLE hello (id int primary key, val text);";
    const createReceipt = await connection.create(createStatement);
    await expect(createReceipt.name).toEqual("hello_115");
    await expect(createReceipt.structureHash).toEqual("ef7be01282ea97380e4d3bbcba6774cbc7242c46ee51b7e611f1efdfa3623e53");

    const payload = JSON.parse(fetch.mock.calls[2][1]?.body as string);

    await expect(payload.params[0]?.statement).toEqual(createStatement);
    await expect(payload.params[0]?.id).toEqual("1143");
    await expect(payload.params[0]?.controller).toEqual("testaddress");
  });

  test("Create table throws if dryrun fails", async function () {
    fetch.mockResponseOnce(FetchAuthorizedListSuccess);
    fetch.mockResponseOnce(FetchCreateDryRunError);
    fetch.mockResponseOnce(FetchCreateTableOnTablelandSuccess);

    await expect(async function () {
      await connection.create(
        "CREATE TABLE 123hello (id int primary key, val text);"
      )
    }).rejects.toThrow("TEST ERROR: invalid sql near 123");

  });
});
