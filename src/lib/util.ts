import { Signer, ethers } from "ethers";
import camelCase from "camelcase";

declare let globalThis: any;

export async function getSigner(): Promise<Signer> {
  await globalThis.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(globalThis.ethereum);
  const signer = provider.getSigner();
  return signer;
}

// From https://www.npmjs.com/package/btoa
const polyfills = {
  btoa: function (str: string) {
    const buffer = Buffer.from(str, "binary");

    return buffer.toString("base64");
  },
};

export const btoa = globalThis.btoa ?? polyfills.btoa;

export type NetworkName = "testnet" | "staging" | "custom";

export type ChainName =
  | "ethereum-goerli"
  | "optimism-kovan"
  | "polygon-mumbai"
  | "optimism-kovan-staging"
  | "custom";

export interface SupportedChain {
  // Matches naming convention used in https://chainlist.org and ethers network lib
  name: string;
  phrase: string;
  chainId: number;
  contract: string;
}

export const SUPPORTED_CHAINS: Record<ChainName, SupportedChain> = {
  // Testnet
  "ethereum-goerli": {
    name: "goerli",
    phrase: "Ethereum Goerli",
    chainId: 5,
    contract: "0xa4b0729f02C6dB01ADe92d247b7425953d1DbA25",
  },
  "optimism-kovan": {
    name: "optimism-kovan",
    phrase: "Optimism Kovan",
    chainId: 69,
    contract: "0xf9C3530C03D335a00163382366a72cc1Ebbd39fF",
  },
  "polygon-mumbai": {
    name: "maticmum",
    phrase: "Polygon Testnet",
    chainId: 80001,
    contract: "0x70364D26743851d4FE43eCb065811402D06bf4AD",
  },
  // staging
  "optimism-kovan-staging": {
    name: "optimism-kovan",
    phrase: "Optimism Kovan",
    chainId: 69,
    contract: "0x322F01e81c38B4211529f334864fA630F6aeA408",
  },
  // Testing
  custom: {
    name: "localhost",
    phrase: "Custom Chain",
    chainId: 31337, // Default to using hardhat chainId
    // If building locally you can put your contract address here or use the contract connection option
    contract: "",
  },
};

// Take an Object with any symantic for key naming and return a new Object with keys that are lowerCamelCase
// Example: `camelCaseKeys({structure_hash: "123"})` returns `{structureHash: "123"}`
export function camelCaseKeys(obj: any): any {
  return Object.fromEntries(
    Object.entries(obj).map((entry: [string, any]) => {
      const key = entry[0];
      const val = entry[1];
      return [camelCase(key), val];
    })
  );
}
