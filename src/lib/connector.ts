import { Signer } from "ethers";
import { list } from "./list.js";
import { Token } from "./token.js";
import { read, write } from "./query.js";
import { create } from "./create.js";
import { hash } from "./hash.js";
import { siwe } from "./siwe.js";
import { receipt, validateWriteQuery } from "./tableland-calls.js";
import { setController } from "./set-controller.js";
import { getController } from "./get-controller.js";
import { lockController } from "./lock-controller.js";
import { schema } from "./schema.js";
import { structure } from "./structure.js";
import {
  SUPPORTED_CHAINS,
  NetworkName,
  ChainName,
  waitConfirm,
} from "./util.js";
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
  // String enum indicating target EVM chain. Defaults to "polygon-mumbai",
  // or `signer.provider.getNetwork` if available.
  chain?: ChainName;
  chainId?: number;
  // Contract address to use for Tableland Tables registry. If provided,
  // overrides defaults derived from network + chain combination.
  contract?: string;
  // Boolean that indicates if tableland writes should be relayed via Validator
  rpcRelay?: boolean;
  // SIWE URI. Defaults to document.location.origin when used in a browser environment and to https://tableland.xyz if document.location is not available.
  siweUri?: string;
}

/**
 * Create client connection with Tableland, EVM, and Gateway.
 * @param options Options to control client connection.
 * @returns Promise that resolves to a Connection object.
 */
export function connect(options: ConnectOptions): Connection {
  const network = options.network ?? "testnet";
  const chain = options.chain ?? "polygon-mumbai";
  if (network === "custom" && !options.host) {
    throw new Error('`host` must be provided if using "custom" network');
  }
  if (!["testnet", "staging", "custom"].includes(network)) {
    throw new Error("unsupported network specified");
  }

  const signer = options.signer;

  const info = SUPPORTED_CHAINS[chain];
  if (!info && !options.chainId) {
    throw new Error(
      "unsupported chain information. See `SUPPORTED_CHAINS` for options"
    );
  }

  const host = options.host ?? info.host;
  const chainId = options.chainId ?? info.chainId;
  // We can override the contract address here for any supported network
  const contract = options.contract ?? info.contract;
  // Enable specifying rpcRelay, otherwise use the SUPPORTED_CHAINS value
  const rpcRelay =
    typeof options.rpcRelay === "boolean" ? options.rpcRelay : info.rpcRelay;
  // If a token was provided, we cache it
  const token = options.token;
  const siweUri =
    options.siweUri ??
    globalThis.document?.location.origin ??
    "https://tableland.xyz";
  const connectionObject: Connection = {
    token,
    signer,
    options: {
      rpcRelay,
      network,
      host,
      chain,
      chainId,
      contract,
      siweUri,
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
    get setController() {
      return setController;
    },
    get getController() {
      return getController;
    },
    get lockController() {
      return lockController;
    },
    get validate() {
      return validateWriteQuery;
    },
    get waitConfirm() {
      return waitConfirm;
    },
    get schema() {
      return schema;
    },
    get structure() {
      return structure;
    },
  };

  return connectionObject;
}
