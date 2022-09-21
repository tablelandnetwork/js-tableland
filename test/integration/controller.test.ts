import { ethers } from "ethers";
import { connect, Connection } from "../src/main";

describe("controller methods", function () {
  let connection: Connection;
  beforeAll(async function () {
    const provider = new ethers.providers.JsonRpcProvider();
    connection = connect({
      chain: "local-tableland",
      signer: provider.getSigner()
    });
    await connection.siwe();
  });

  test("setting controller succeeds", async function () {
    const res = await connection.setController(
      "0xControllerContract",
      "prefix_74613_1"
    );
    expect(res).toEqual({ hash: "testhashsetcontrollerresponse" });
  });

  test("getting controller succeeds", async function () {
    const res = await connection.getController("prefix_74613_1");
    expect(res).toEqual("0xControllerContract");
  });

  test("locking controller succeeds", async function () {
    const res = await connection.lockController("1");
    expect(res).toEqual({ hash: "testhashlockcontrollerresponse" });
  });
});
