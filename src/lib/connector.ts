import { Signer } from "ethers";
import { list } from "./list.js";
import { Token } from "./token.js";
import { read, write } from "./query.js";
import { create } from "./create.js";
import { hash } from "./hash.js";
import { siwe } from "./siwe.js";
import { receipt } from "./tableland-calls.js";
import { SUPPORTED_CHAINS, NetworkName, ChainName } from "./util.js";
import { Connection } from "./connection.js";

/**
 * Options to control client connection with Tableland, EVM, and Gateway.
 */
export interface ConnectOptions {
  // Override any required signature by using a pre-signed SIWE token.
  token?: Token;
  // Signer interface for signing tokens and transactions.
  signer?: Signer;
  // Remote gateway host for RPC API calls.
  host?: string;
  // String enum indicating Tableland network. Defaults to "testnet".
  network?: NetworkName;
  // String enum indicating target EVM chain. Defaults to "goerli",
  // or `signer.provider.getNetwork` if available.
  chain?: ChainName;
  chainId?: number;
  // Contract address to use for Tableland Tables registry. If provided,
  // overrides defaults derived from network + chain combination.
  contract?: string;
}

/**
 * Create client connection with Tableland, EVM, and Gateway.
 * @param options Options to control client connection.
 * @returns Promise that resolves to a Connection object.
 */
export async function connect(options: ConnectOptions): Promise<Connection> {
  const network = options.network ?? "testnet";
  let chain = options.chain ?? "ethereum-goerli";
  if (network === "custom" && !options.host) {
    throw new Error('`host` must be provided if using "custom" network');
  }
  if (!["testnet", "staging", "custom"].includes(network)) {
    throw new Error("unsupported network specified");
  }
  const host =
    options.host ??
    `https://${
      network === "testnet" ? "testnetv2" : "staging"
    }.tableland.network`;

  const signer = options.signer;
  if (signer && signer.provider) {
    // Set params with provider network info if not explicitly given in options
    if (!options.chain && !options.chainId) {
      const { name } = await signer.provider.getNetwork();
      const found = Object.entries(SUPPORTED_CHAINS).find(
        ([, chainEntry]) => chainEntry.name === name
      );
      if (found) {
        chain = found[0] as ChainName;
      } else {
        throw new Error(
          "proivder chain mismatch. Switch your wallet connection and reconnect"
        );
      }
    }
  }

  const info = SUPPORTED_CHAINS[chain];
  if (!info && !options.chainId) {
    throw new Error(
      "unsupported chain information. See `SUPPORTED_CHAINS` for options"
    );
  }

  const chainId = options.chainId ?? info.chainId;
  // We can override the contract address here for any supported network
  const contract = options.contract ?? info.contract;
  // If a token was provided, we cache it
  const token = options.token;
  const connectionObject: Connection = {
    token,
    signer,
    options: {
      network,
      host,
      chain,
      chainId,
      contract,
    },
    get list() {
      return list;
    },
    get read() {
      return read;
    },
    get write() {
      return write;
    },
    get create() {
      return create;
    },
    get hash() {
      return hash;
    },
    get receipt() {
      return receipt;
    },
    get siwe() {
      return siwe;
    },
  };

  return connectionObject;
}
