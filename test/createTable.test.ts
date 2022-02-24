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

    const createReceipt = await connection.create(
      "CREATE TABLE hello (id int primary key, val text);"
    );
    await expect(createReceipt.name).toEqual("hello_115");
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
