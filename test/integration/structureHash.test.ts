import { ethers } from "ethers";
import { connect, Connection } from "../src/main";

describe("has method", function () {
  let connection: Connection;
  beforeAll(async function () {
    const provider = new ethers.providers.JsonRpcProvider();
    connection = connect({
      chain: "local-tableland",
      signer: provider.getSigner()
    });
  });

  test("Hashing a table works", async function () {
    const schema = "id int primary key, val text";
    const prefix = "hello";
    const hashResponse = await connection.hash(schema, { prefix });

    expect(hashResponse.structureHash).toEqual(
      "ef7be01282ea97380e4d3bbcba6774cbc7242c46ee51b7e611f1efdfa3623e53"
    );
  });

  test("Hashing a table throws if statement is not valid", async function () {
    await expect(async function () {
      await connection.hash("(id int primary key, val text);", {
        prefix: "123hello}",
      });
    }).rejects.toThrow("TEST ERROR: invalid sql near 123");
  });
});
