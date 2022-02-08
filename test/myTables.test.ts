import fetch from "jest-fetch-mock";
import { FetchMyTables } from "../test/fauxFetch";
import { connect, myTables } from "../src/main";

beforeAll(function () {
  connect({ network: "testnet", host: "https://testnet.tableland.network" });
});

describe("These tests check the myTable SDK call.", function () {
  test("When I fetch my tables, I get some tables", async function () {
    fetch.mockResponse(FetchMyTables);

    const resp = await myTables();
    expect(resp[0].id).toEqual("71bb8c56-a44e-4a75-aa9c-8158cefda5d7");
  });
});
