import fetch from "jest-fetch-mock";
import { connect } from "../src/main";
import {
  FetchHashTableSuccess,
  FetchHashTableError
} from "./fauxFetch";

describe("has method", function () {
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

  test("Hashing a table works", async function () {
    fetch.mockResponseOnce(FetchHashTableSuccess);

    const createStatement = "CREATE TABLE hello (id int primary key, val text);";
    const hashResponse = await connection.hash(createStatement);

    const payload = JSON.parse(fetch.mock.calls[0][1]?.body as string);

    // test that faux response makes it through
    await expect(hashResponse.structureHash).toEqual("ef7be01282ea97380e4d3bbcba6774cbc7242c46ee51b7e611f1efdfa3623e53");

    // test that fetch is called how validator expects
    await expect(payload.params[0]?.create_statement).toEqual(createStatement);
    await expect(payload.params[0]?.controller).toEqual("testaddress");
    await expect(payload.params[0]).not.toHaveProperty("id");
  });

  test("Hashing a table throws if statement is not valid", async function () {
    fetch.mockResponseOnce(FetchHashTableError);

    await expect(async function () {
      await connection.hash(
        "CREATE TABLE 123hello (id int primary key, val text);"
      )
    }).rejects.toThrow("TEST ERROR: invalid sql near 123");
  });
});
