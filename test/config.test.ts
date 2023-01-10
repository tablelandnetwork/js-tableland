import { rejects, strictEqual } from "assert";
import { describe, test } from "mocha";
import { getAccounts } from "@tableland/local";
import {
  extractBaseUrl,
  extractSigner,
  ReadConfig,
  type SignerConfig,
  type Config,
} from "../src/helpers/config.js";
import {
  getDefaultProvider,
  type ExternalProvider,
  getChainId,
} from "../src/helpers/index.js";

describe("config", function () {
  describe("extractBaseUrl()", function () {
    test("where baseUrl is explicitly provided", async function () {
      const conn: ReadConfig = { baseUrl: "baseUrl" };
      const extracted = await extractBaseUrl(conn);
      strictEqual(extracted, "baseUrl");
    });

    test("where baseUrl is obtained via the chainId", async function () {
      const [, wallet] = getAccounts();
      const signer = wallet.connect(
        getDefaultProvider("http://127.0.0.1:8545")
      );
      const conn: SignerConfig = { signer };
      const extracted = await extractBaseUrl(conn);
      strictEqual(extracted, "http://localhost:8080/api/v1");
    });

    test("where baseUrl is obtained via a fallback chainId", async function () {
      const chainNameOrId = getChainId("localhost");
      const conn: Config = {};
      const extracted = await extractBaseUrl(conn, chainNameOrId);
      strictEqual(extracted, "http://localhost:8080/api/v1");
    });

    test("where baseUrl cannot be extracted", async function () {
      const conn: Config = {};
      await rejects(extractBaseUrl(conn), (err: any) => {
        strictEqual(
          err.message,
          "missing connection information: baseUrl, signer, or chainId required"
        );
        return true;
      });
    });
  });
  describe("extractSigner()", function () {
    test("where signer is explicitly provided", async function () {
      const [, wallet] = getAccounts();
      const signer = wallet.connect(getDefaultProvider());
      const conn: SignerConfig = { signer };
      const extracted = await extractSigner(conn);
      strictEqual(await extracted.getAddress(), wallet.address);
    });

    test("where signer is obtained via an external provider", async function () {
      const conn: Config = {};
      const external = {
        request: async (request: {
          method: string;
          params?: any[];
        }): Promise<any> => {},
      };
      const extracted = await extractSigner(conn, external);
      strictEqual(extracted._isSigner, true);
    });

    test("where signer is obtained via an external provider and it fails", async function () {
      const conn: Config = {};
      const external = {};
      await rejects(extractSigner(conn, external), (err: any) => {
        strictEqual(
          err.message,
          "provider error: missing request method on ethereum provider"
        );
        return true;
      });
    });

    test("where signer is obtained via an injected provider", async function () {
      const conn: Config = {};
      const ethereum: ExternalProvider = {
        request: async (request: {
          method: string;
          params?: any[];
        }): Promise<any> => {},
      };
      (globalThis as any).ethereum = ethereum;
      const extracted = await extractSigner(conn);
      extracted._checkProvider();
      strictEqual(extracted._isSigner, true);
      delete (globalThis as any).ethereum;
    });

    test("where signer cannot be extracted", async function () {
      const conn: Config = {};
      await rejects(extractSigner(conn), (err: any) => {
        strictEqual(
          err.message,
          "provider error: missing global ethereum provider"
        );
        return true;
      });
    });
  });
});
