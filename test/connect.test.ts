import fetch from "jest-fetch-mock";
import { Signer } from "ethers";
import flushPromises from "flush-promises";
// eslint-disable-next-line camelcase
import { TablelandTables__factory } from "@tableland/evm";
import { connect, NetworkName, SUPPORTED_CHAINS } from "../src/main";
import { ConnectOptions } from "../src/lib/connector.js";
import {
  FetchCreateDryRunSuccess,
  FetchHashTableSuccess,
  FetchReceiptExists,
} from "./fauxFetch";

describe("connect function", function () {
  beforeAll(async function () {
    // reset in case another test file hasn't cleaned up
    fetch.resetMocks();
  });

  afterEach(function () {
    // ensure mocks don't bleed into other tests
    fetch.resetMocks();
  });

  test("exposes signer with correct address", async function () {
    fetch.mockResponseOnce(FetchHashTableSuccess);
    const connection = connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
    });

    // Just do this to lazily get the signer
    const createStatement =
      "CREATE TABLE hello (id int primary key, val text);";
    await connection.hash(createStatement);

    expect(await connection.signer?.getAddress()).toMatch("testaddress");
  });

  test("exposes public methods and properties", async function () {
    const connection = connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
    });

    expect(connection.options.network).toBe("testnet");
    expect(connection.options.host).toBe("https://testnet.tableland.network");
    expect(connection.token).toBe(undefined);
    expect(connection.signer).toBe(undefined);
    expect(typeof connection.list).toBe("function");
    expect(typeof connection.read).toBe("function");
    expect(typeof connection.write).toBe("function");
    expect(typeof connection.create).toBe("function");
  });

  test("allows specifying connection network", async function () {
    const factorySpy = jest.spyOn(TablelandTables__factory, "connect");
    const connection = connect({
      network: "testnet",
      host: "https://testnetv2.tableland.network",
    });

    fetch.mockResponseOnce(FetchCreateDryRunSuccess);
    fetch.mockResponseOnce(FetchReceiptExists);

    await connection.create("id int primary key, val text", {
      prefix: "hello",
    });

    expect(factorySpy).toHaveBeenCalled();
    expect(SUPPORTED_CHAINS["polygon-mumbai"].contract).toBe(
      factorySpy.mock.calls[0][0]
    );
  });

  test("allows specifying connection token", async function () {
    const connection1 = connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
    });

    // We wait for over 1 second so that if the two connections are generating different tokens
    // then the expirations will be different. This will ensure the assertion will only succeed
    //  if the passed in token value is used
    await new Promise((resolve) => setTimeout(() => resolve(null), 1001));
    await flushPromises();

    const connection2 = connect({
      network: "testnet",
      host: "https://testnet.tableland.network",
      token: connection1.token,
    });

    expect(connection1.token?.token === connection2.token?.token).toBe(true);
  });

  test("throws error if provider network is not supported", async function () {
    await expect(async function () {
      const connection = connect({
        network: "testnet",
        host: "https://testnetv2.tableland.network",
        signer: {
          provider: {
            getNetwork: async function () {
              return { name: "ropsten", chainId: 1 };
            },
          } as any,
          getAddress: async function () {
            return "testaddress";
          },
          signMessage: async function () {
            return "testsignedmessage";
          },
        } as unknown as Signer, // convince type checks into letting us mock the signer
      });

      await connection.siwe();
    }).rejects.toThrow(
      "provider chain and tableland network mismatch. Switch your wallet connection and reconnect"
    );
  });

  test("throws error if connection network is not supported and no host is provided", async function () {
    await expect(async function () {
      return connect({
        network: "furrykitties" as NetworkName,
      });
    } as ConnectOptions).rejects.toThrow("unsupported network specified");
  });
});
