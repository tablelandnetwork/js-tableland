import fetch from "jest-fetch-mock";
import { FetchMyTables } from "../test/fauxFetch";
import { connect } from "../src/main";

describe("list method", function () {
  let list: any, connection: any;
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
    connection = await connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
    });
    list = connection.list;
  });

  afterEach(function () {
    // ensure mocks don't bleed into other tests
    fetch.resetMocks();
  });

  test("When I fetch my tables, I get some tables", async function () {
    fetch.mockResponseOnce(FetchMyTables);

    const resp = await list.call(connection);
    await expect(resp[0].id).toEqual("71bb8c56-a44e-4a75-aa9c-8158cefda5d7");
  });
});
