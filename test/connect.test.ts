import fetch from "jest-fetch-mock";
import { connect } from "../src/main";

describe('connect function', function () {
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
  });

  afterEach(function () {
    // ensure mocks don't bleed into other tests
    fetch.resetMocks();
  });

  test.skip("Check connect", async function () {
    const connection = await connect({ network: "testnet", host: "https://testnet.tableland.network" });

    await expect(await connection.signer.getAddress()).toMatchObject("TODO: test connection");
  });
});