import { ethers } from "ethers";
import { connect } from "../src/main";

describe("list method", function () {
  let connection: any;
  beforeAll(async function () {
    const provider = new ethers.providers.JsonRpcProvider();
    connection = connect({
      chain: "local-tableland",
      signer: provider.getSigner()
    });
  });

  test("When I fetch my tables, I get some tables", async function () {
    const resp = await connection.list();
    const table = resp[0];

    expect(table.name).toEqual("test_list_query_table");
    expect(table.description).toEqual("");
    expect(table.structure).toEqual(
      "7837fa79ed5151d99da5051b41d7387e7c249a2b0321d440138c81108160cdd9"
    );
    expect(table.created_at).toEqual("2022-02-11T02:12:19.80809Z");
  });

  test("If I have no tables, I get empty Array", async function () {
    const resp = await connection.list();

    expect(resp).toEqual([]);
  });
});
