import { Signer, ethers } from "ethers";
import camelCase from "camelcase";
import { proxies } from "@tableland/evm/proxies.js";
import {
  Connection,
  ReceiptResult,
  MethodOptions,
  ConfirmOptions,
} from "./connection.js";

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
  | "local-tableland"
  | "custom";

export interface SupportedChain {
  // Matches naming convention used in https://chainlist.org and ethers network lib
  name: string;
  phrase: string;
  chainId: number;
  contract: string;
  host: string;
  rpcRelay: boolean;
}

export const SUPPORTED_CHAINS: Record<ChainName, SupportedChain> = {
  // Testnet
  "ethereum-goerli": {
    name: "goerli",
    phrase: "Ethereum Goerli",
    chainId: 5,
    contract: proxies["ethereum-goerli"],
    host: "https://testnet.tableland.network",
    rpcRelay: true,
  },
  "optimism-kovan": {
    name: "optimism-kovan",
    phrase: "Optimism Kovan",
    chainId: 69,
    contract: proxies["optimism-kovan"],
    host: "https://testnet.tableland.network",
    rpcRelay: true,
  },
  "polygon-mumbai": {
    name: "maticmum",
    phrase: "Polygon Testnet",
    chainId: 80001,
    contract: proxies["polygon-mumbai"],
    host: "https://testnet.tableland.network",
    rpcRelay: true,
  },
  // staging
  "optimism-kovan-staging": {
    name: "optimism-kovan",
    phrase: "Optimism Kovan",
    chainId: 69,
    contract: proxies["optimism-kovan-staging"],
    host: "https://staging.tableland.network",
    rpcRelay: true,
  },
  "local-tableland": {
    name: "localhost",
    phrase: "Local Tableland",
    chainId: 31337,
    contract: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    host: "http://localhost:8080",
    rpcRelay: true,
  },
  // Testing
  custom: {
    name: "localhost",
    phrase: "Custom Chain",
    chainId: 31337, // Default to using hardhat chainId
    // If building locally you can put your contract address and host here or use the contract connection option
    contract: "",
    host: "",
    rpcRelay: true,
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

// Helper function to enable waiting until a transaction has been materialized by the Validator.
// Uses simple polling with exponential backoff up to a maximum timeout.
// Potential optimization could be had if the Validator supports subscribing to transaction
// receipts via Websockets or long-poling in the future
export async function waitConfirm(
  this: Connection,
  txnHash: string,
  options?: ConfirmOptions
): Promise<ReceiptResult> {
  // default timeout 2 minutes
  const timeout = getTimeout(options);

  // determines how often to check for materialization before timeout
  const rate = options?.rate ?? 1500;
  const start = Date.now();

  // next tick then try immediately
  await new Promise((resolve) => setTimeout(resolve, 0));
  let table = await this.receipt(txnHash);

  let tries = 0;
  while (!table && start + timeout > Date.now()) {
    // increase the time between each call, but never go past the specified timeout
    const waitForMs = rate * Math.pow(2, tries);
    const nextTry =
      start + timeout < Date.now() + waitForMs
        ? start + timeout - Date.now()
        : waitForMs;

    await new Promise((resolve) => setTimeout(resolve, nextTry));
    table = await this.receipt(txnHash);
    tries++;
  }

  // Throw and let the caller decide what to do if the timeout is exceeded
  if (!table) {
    throw new Error(
      `timeout exceeded: could not get transaction receipt: ${txnHash}`
    );
  }

  return table;
}

export function getPrefix(options?: MethodOptions): string {
  if (typeof options === "undefined") return "";
  return options.prefix || "";
}

export function shouldSkipConfirm(options?: MethodOptions): boolean {
  if (typeof options === "undefined") return false;
  return !!options.skipConfirm;
}

export const defaultTimeout = 120 * 1000; // 2 mintues
export function getTimeout(options?: MethodOptions): number {
  if (typeof options === "undefined") return defaultTimeout;
  if (typeof options.timeout !== "number") return defaultTimeout;

  return options.timeout;
}
