import fs from "node:fs";
import { type WaitableTransactionReceipt } from "../registry/utils.js";
import { type ChainName, getBaseUrl } from "./chains.js";
import { type Signer, type ExternalProvider, getSigner } from "./ethers.js";

export interface ReadConfig {
  baseUrl: string;
  aliases?: AliasesNameMap;
}

export interface SignerConfig {
  signer: Signer;
}

export interface AutoWaitConfig {
  autoWait: boolean;
}

export type Config = Partial<ReadConfig & SignerConfig>;

export type NameMapping = Record<string, string>;

export interface AliasesNameMap {
  read: () => Promise<NameMapping>;
  write: (map: NameMapping) => Promise<void>;
}

export async function checkWait(
  config: Config & Partial<AutoWaitConfig>,
  receipt: WaitableTransactionReceipt
): Promise<WaitableTransactionReceipt> {
  if (config.autoWait ?? false) {
    const waited = await receipt.wait();
    return { ...receipt, ...waited };
  }
  return receipt;
}

export async function extractBaseUrl(
  conn: Config = {},
  chainNameOrId?: ChainName | number
): Promise<string> {
  if (conn.baseUrl == null) {
    if (conn.signer == null) {
      if (chainNameOrId == null) {
        throw new Error(
          "missing connection information: baseUrl, signer, or chainId required"
        );
      }
      return getBaseUrl(chainNameOrId);
    }
    const chainId = await conn.signer.getChainId();
    return getBaseUrl(chainId);
  }
  return conn.baseUrl;
}

export async function extractSigner(
  conn: Config = {},
  external?: ExternalProvider
): Promise<Signer> {
  if (conn.signer == null) {
    return await getSigner(external);
  }
  return conn.signer;
}

export async function extractChainId(conn: Config = {}): Promise<number> {
  const signer = await extractSigner(conn);
  const chainId = await signer.getChainId();

  if (chainId === 0 || isNaN(chainId) || chainId == null) {
    /* c8 ignore next 4 */
    throw new Error(
      "cannot find chainId: is your signer connected to a network?"
    );
  }

  return chainId;
}

const findOrCreateFile = function (filepath: string): Buffer {
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify({}));
  }

  return fs.readFileSync(filepath);
};

export function jsonFileAliases(filepath: string): AliasesNameMap {
  return {
    read: async function (): Promise<NameMapping> {
      const jsonBuf = findOrCreateFile(filepath);
      return JSON.parse(jsonBuf.toString());
    },
    write: async function (nameMap: NameMapping) {
      fs.writeFileSync(filepath, JSON.stringify(nameMap));
    },
  };
}
