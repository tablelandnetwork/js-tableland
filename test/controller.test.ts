import fetch from "jest-fetch-mock";
import { connect, Connection } from "../src/main";
import { FetchSetControllerSuccess } from "./fauxFetch";
import { chainId } from "./constants";

describe("controller methods", function () {
  let connection: Connection;
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
    connection = connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
      chainId,
    });
    await connection.siwe();
  });

  afterEach(function () {
    // ensure mocks don't bleed into other tests
    fetch.resetMocks();
  });

  test("setting controller succeeds", async function () {
    fetch.mockResponseOnce(FetchSetControllerSuccess);

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
