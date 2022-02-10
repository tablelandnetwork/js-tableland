import fetch from "jest-fetch-mock";
import { connect } from "../src/main";
import {
  FetchAuthorizedListSuccess,
  FetchCreateTableOnTablelandSuccess,
} from "./fauxFetch";

describe('createTable method', function () {
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

  test("Create table works", async function () {
    fetch.mockResponseOnce(FetchAuthorizedListSuccess);
    fetch.mockResponseOnce(FetchCreateTableOnTablelandSuccess);

    const createTableReceipt = await connection.createTable(
      "CREATE TABLE Hello (id int primary key, val text)"
    );
    await expect(createTableReceipt.name).toEqual("Hello_115");
  });

});