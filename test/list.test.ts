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
    const table = resp[0];

    await expect(table.name).toEqual("test_list_query_table");
    await expect(table.description).toEqual("");
    await expect(table.structure).toEqual(
      "7837fa79ed5151d99da5051b41d7387e7c249a2b0321d440138c81108160cdd9"
    );
    await expect(table.created_at).toEqual("2022-02-11T02:12:19.80809Z");
  });
});
