import fetch from "jest-fetch-mock";
import { connect } from "../src/main";
import {
  FetchAuthorizedListSuccess,
  FetchCreateTableOnTablelandSuccess,
} from "./fauxFetch";

describe('createTable method', function () {
  let createTable: any, connection: any;
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
    connection = await connect({ network: "derpnet", host: "https://derp.tableland.network" });
    createTable = connection.myTables;
  });

  afterEach(function () {
    // ensure mocks don't bleed into other tests
    fetch.resetMocks();
  });

  test("Throw error when not connected", async function () {
    fetch.mockResponseOnce(FetchCreateTableOnTablelandSuccess);
    await expect(createTable.call(connection, "CREATE TABLE test (a INT);")).rejects.toThrow(
      "Please connect your account before trying anything."
    );
  });

  test("Create table works", async function () {
    await connect({ host: "https://derp.tableland.network" });
    fetch.mockResponseOnce(FetchAuthorizedListSuccess);
    fetch.mockResponseOnce(FetchCreateTableOnTablelandSuccess);

    const createTableReceipt = await createTable.call(connection, 
      "CREATE TABLE Hello (id int primary key, val text)"
    );
    await expect(createTableReceipt.name).toEqual("Hello_115");
  });

});