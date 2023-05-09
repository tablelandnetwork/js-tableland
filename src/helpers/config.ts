import { type WaitableTransactionReceipt } from "../registry/utils.js";
import { type ChainName, getBaseUrl } from "./chains.js";
import { type Signer, type Eip1193Provider, getSigner } from "./ethers.js";

export interface ReadConfig {
  baseUrl: string;
}

export interface SignerConfig {
  signer: Signer;
}

export interface AutoWaitConfig {
  autoWait: boolean;
}

export type Config = Partial<ReadConfig & SignerConfig>;

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
  if (conn.baseUrl != null) return conn.baseUrl;
  if (conn.signer != null) {
    const chainId = await conn.signer.getChainId();
    return getBaseUrl(chainId);
  }
  if (chainNameOrId != null) {
    return getBaseUrl(chainNameOrId);
  }

  throw new Error(
    "missing connection information: baseUrl, signer, or chainId required"
  );
}

export async function extractSigner(
  conn: Config = {},
  external?: Eip1193Provider
): Promise<Signer> {
  if (conn.signer == null) {
    return await getSigner(external);
  }
  return conn.signer;
}

export async function extractChainId(conn: Config = {}): Promise<number> {
  const signer = await extractSigner(conn);
  const network = await signer.provider?.getNetwork();

  if (
    network == null ||
    network.chainId === BigInt("0") ||
    network.chainId == null
  ) {
    /* c8 ignore next 4 */
    throw new Error(
      "cannot find chainId: is your signer connected to a network?"
    );
  }

  return Number(network.chainId);
}
