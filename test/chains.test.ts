import { strictEqual, throws } from "assert";
import { describe, test } from "mocha";
import {
  getBaseUrl,
  getChainInfo,
  getContractAddress,
  getChainId,
  isTestnet,
  type ChainName,
  supportedChains,
  overrideDefaults,
} from "../src/helpers/chains.js";

describe("chains", function () {
  describe("getBaseUrl()", function () {
    test("where we check some of the known defaults", function () {
      // We don't require a specific set because we don't want to have to update
      // these tests every time
      const localhost = "http://localhost:8080/api/v1";
      const testnets = "https://testnets.tableland.network/api/v1";
      const mainnet = "https://tableland.network/api/v1";
      strictEqual(getBaseUrl("localhost"), localhost);
      strictEqual(getBaseUrl("maticmum"), testnets);
      strictEqual(getBaseUrl("matic"), mainnet);
      strictEqual(getBaseUrl("optimism"), mainnet);
      strictEqual(getBaseUrl("mainnet"), mainnet);
    });

    test("where we check the known default localhost contract address", async function () {
      const localhost = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
      const matic = "0x5c4e6A9e5C1e1BF445A062006faF19EA6c49aFeA";
      // Note we're checking local-tableland here, rather than localhost
      strictEqual(
        getContractAddress("local-tableland").toLowerCase(),
        localhost.toLowerCase()
      );
      strictEqual(
        getContractAddress("matic").toLowerCase(),
        matic.toLowerCase()
      );
    });

    test("where we make sure a testnet is correctly flagged", function () {
      const testnets: ChainName[] = [
        "goerli",
        "arbitrum-goerli",
        "maticmum",
        "optimism-goerli",
        "local-tableland",
        "localhost",
      ];
      const mainnets: ChainName[] = [
        "mainnet",
        "arbitrum",
        "matic",
        "optimism",
      ];
      for (const net of testnets) {
        strictEqual(isTestnet(net), true);
      }
      for (const net of mainnets) {
        strictEqual(isTestnet(net), false);
      }
    });

    test("where we make sure supportedChains is a valid object", function () {
      strictEqual(Object.keys(supportedChains).length >= 12, true);
      strictEqual(Object.keys(supportedChains).includes("mainnet"), true);
      strictEqual(Object.keys(supportedChains).includes("maticmum"), true);
      strictEqual(Object.keys(supportedChains).includes("localhost"), true);
    });

    test("where ensure we have a default set of chains with ids", function () {
      strictEqual(getChainId("mainnet"), 1);
      strictEqual(getChainId("localhost"), 31337);
      strictEqual(getChainId("maticmum"), 80001);
      strictEqual(getChainId("optimism"), 10);
      strictEqual(getChainId("arbitrum"), 42161);
    });

    test("where spot check a few chain info objects", function () {
      const localhostUrl = "http://localhost:8080/api/v1";
      const testnetsUrl = "https://testnets.tableland.network/api/v1";
      const mainnetUrl = "https://tableland.network/api/v1";

      const mainnet = getChainInfo("mainnet");
      strictEqual(mainnet.baseUrl, mainnetUrl);
      strictEqual(mainnet.chainId, 1);
      const localhost = getChainInfo("localhost");
      strictEqual(localhost.baseUrl, localhostUrl);
      strictEqual(localhost.chainId, 31337);
      const maticmum = getChainInfo("maticmum");
      strictEqual(maticmum.baseUrl, testnetsUrl);
      strictEqual(maticmum.chainId, 80001);
    });
  });

  describe("overrideDefaults()", function () {
    test("when called incorrectly", async function () {
      throws(
        // @ts-expect-error need to tell ts to ignore this since we are testing a failure when used without ts
        () => overrideDefaults("homestead"), // didn't pass in overrides
        (err: any) => {
          strictEqual(err.message, "override values must be an Object");
          return true;
        }
      );
    });
  });
});
