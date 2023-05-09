import {
  getDefaultProvider,
  BrowserProvider,
  EventLog,
  type Eip1193Provider,
  type ContractTransactionResponse,
  type ContractTransactionReceipt,
  type Signer,
  type Overrides,
} from "ethers";
import { type TransactionReceipt } from "../validator/receipt.js";
import { type SignerConfig } from "./config.js";

// eslint-disable-next-line @typescript-eslint/no-namespace
declare module globalThis {
  // eslint-disable-next-line no-var
  var ethereum: Eip1193Provider | undefined;
}

/**
 * Request a set of opinionated overrides to be used when calling the Tableland contract.
 * @param signer A valid web3 provider/signer.
 * @returns A promise that resolves to an object with overrides.
 */
export async function getOverrides({
  signer,
}: SignerConfig): Promise<Overrides> {
  // Hack: Revert to gasPrice to avoid always underpriced eip-1559 transactions on Polygon
  const opts: Overrides = {};
  const network = await signer.provider?.getNetwork();
  /* c8 ignore next 7 */
  if (network?.chainId === BigInt("137")) {
    const feeData = await signer.provider?.getFeeData();
    if (feeData?.gasPrice != null) {
      opts.gasPrice =
        // NOTE: There's no guarantee `feeData.gasPrice` is a JS safe integer which means
        // this might not be accurate, but it's just an estimate so this is probably ok
        Math.floor(Number(feeData.gasPrice) * 1.1) ?? undefined;
    }
  }
  return opts;
}

/**
 * RegistryReceipt is based on the TransactionReceipt type which defined by the API spec.
 * The API v1 has a known problem where it only returns the first tableId from a transaction.
 */
export type RegistryReceipt = Required<
  Omit<TransactionReceipt, "error" | "errorEventIdx">
>;

/**
 * MultiEventTransactionReceipt represents a mapping of a response from a Validator
 * transaction receipt to the tableIds that were affected.
 * @typedef {Object} MultiEventTransactionReceipt
 * @property {string[]} tableIds - The list of table ids affected in the transaction
 * @property {string} transactionHash - The hash of the transaction
 * @property {number} blockNumber - The block number of the transaction
 * @property {number} chainId - The chain id of the transaction
 */
export interface MultiEventTransactionReceipt {
  tableIds: string[];
  transactionHash: string;
  blockNumber: number;
  chainId: number;
}

/**
 *
 * Given a transaction, this helper will return the tableIds that were part of the transaction.
 * Especially useful for transactions that create new tables because you need the tableId to
 * calculate the full table name.
 * @param {tx} a contract transaction
 * @returns {MultiEventTransactionReceipt} tableland receipt
 *
 */
export async function getContractReceipt(
  tx: ContractTransactionResponse
): Promise<MultiEventTransactionReceipt> {
  const receipt = await tx.wait();

  if (receipt == null) {
    throw new Error(
      `could not get receipt for transaction: ${JSON.stringify(tx, null, 4)}`
    );
  }

  /* c8 ignore next */
  const logs = receipt.logs ?? [];
  const transactionHash = receipt.hash;
  const blockNumber = receipt.blockNumber;
  // NOTE: chainId is always a JS safe integer
  const chainId = Number(tx.chainId);
  const tableIds: string[] = [];
  for (const log of logs) {
    if (!(log instanceof EventLog)) continue;

    const tableId = log.args?.tableId != null && log.args.tableId.toString();

    switch (log.eventName) {
      case "CreateTable":
      case "RunSQL":
        if (tableId != null) tableIds.push(tableId);

        break;
      default:
      // Could be a Transfer or other
    }
  }
  return { tableIds, transactionHash, blockNumber, chainId };
}

/**
 * Request a signer object from the global ethereum object.
 * @param external A valid external provider. Defaults to `globalThis.ethereum` if not provided.
 * @returns A promise that resolves to a valid web3 provider/signer
 * @throws If no global ethereum object is available.
 */
export async function getSigner(external?: Eip1193Provider): Promise<Signer> {
  const provider = external ?? globalThis.ethereum;
  if (provider == null) {
    throw new Error("provider error: missing global ethereum provider");
  }
  if (provider.request == null) {
    throw new Error(
      "provider error: missing request method on ethereum provider"
    );
  }
  await provider.request({ method: "eth_requestAccounts" });
  const web3Provider = new BrowserProvider(provider);
  return await web3Provider.getSigner();
}

export {
  getDefaultProvider,
  type Signer,
  type ContractTransactionResponse,
  type ContractTransactionReceipt,
  type Eip1193Provider,
};
