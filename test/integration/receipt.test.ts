import { ethers } from "ethers";
import { connect } from "../src/main";
import { chainId } from "./constants";

describe("has method", function () {
  let connection: any;
  beforeAll(async function () {
    const provider = new ethers.providers.JsonRpcProvider();
    connection = connect({
      chain: "local-tableland",
      signer: provider.getSigner()
    });
  });

  test("Can get receipt of a processed transaction", async function () {
    const receipt = await connection.receipt("0x017");

    // test that faux response makes it through
    expect(receipt).toEqual({
      chainId,
      txnHash:
        "0xc3e7d1e81b59556f414a5f5c23760eb61b4bfaa18150d924d7d3b334941dbecd",
      blockNumber: 1000,
      tableId: "2",
    });
  });

  test("Returns undefined for unprocessed transaction", async function () {
    const receipt = await connection.receipt("0x017");

    // test that faux response makes it through
    expect(receipt).toEqual(undefined);
  });
});
