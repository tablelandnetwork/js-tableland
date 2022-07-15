import fetch from "jest-fetch-mock";
import { FetchMyTables, FetchNoTables } from "../test/fauxFetch";
import { connect } from "../src/main";

describe("list method", function () {
  let connection: any;
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
    connection = connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
    });
  });

  afterEach(function () {
    // ensure mocks don't bleed into other tests
    fetch.resetMocks();
  });

  test("When I fetch my tables, I get some tables", async function () {
    fetch.mockResponseOnce(FetchMyTables);

    const resp = await connection.list();
    const table = resp[0];

    await expect(table.name).toEqual("test_list_query_table");
    await expect(table.description).toEqual("");
    await expect(table.structure).toEqual(
      "7837fa79ed5151d99da5051b41d7387e7c249a2b0321d440138c81108160cdd9"
    );
    await expect(table.created_at).toEqual("2022-02-11T02:12:19.80809Z");
  });

  test("If I have no tables, I get empty Array", async function () {
    fetch.mockResponseOnce(FetchNoTables);

    const resp = await connection.list();

    await expect(resp).toEqual([]);
  });
});
