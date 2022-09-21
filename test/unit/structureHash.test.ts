import fetch from "jest-fetch-mock";
import { connect, Connection } from "../../src/main";
import { FetchHashTableSuccess, FetchHashTableError } from "./fauxFetch";
import { chainId } from "./constants";

describe("has method", function () {
  let connection: Connection;
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
    connection = connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
      chainId,
    });
  });

  afterEach(function () {
    // ensure mocks don't bleed into other tests
    fetch.resetMocks();
  });

  test("Hashing a table works", async function () {
    fetch.mockResponseOnce(FetchHashTableSuccess);

    const schema = "id int primary key, val text";
    const prefix = "hello";
    const createStatement = `CREATE TABLE ${prefix}_${chainId} (${schema});`;
    const hashResponse = await connection.hash(schema, { prefix });

    const payload = JSON.parse(fetch.mock.calls[0][1]?.body as string);

    // test that faux response makes it through
    expect(hashResponse.structureHash).toEqual(
      "ef7be01282ea97380e4d3bbcba6774cbc7242c46ee51b7e611f1efdfa3623e53"
    );

    // test that fetch is called how validator expects
    expect(payload.params[0]?.create_statement).toEqual(createStatement);
    expect(payload.params[0]).not.toHaveProperty("id");
  });

  test("Hashing a table throws if statement is not valid", async function () {
    fetch.mockResponseOnce(FetchHashTableError);

    await expect(async function () {
      await connection.hash("(id int primary key, val text);", {
        prefix: "123hello}",
      });
    }).rejects.toThrow("TEST ERROR: invalid sql near 123");
  });
});
