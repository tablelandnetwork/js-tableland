import {
  providers,
  type Signer,
  type Overrides,
  type ContractTransaction,
  type ContractReceipt,
} from "ethers";
import { type TransactionReceipt } from "../validator/receipt.js";
import { type SignerConfig } from "./config.js";

type ExternalProvider = providers.ExternalProvider;
const { getDefaultProvider, Web3Provider } = providers;

// eslint-disable-next-line @typescript-eslint/no-namespace
declare module globalThis {
  // eslint-disable-next-line no-var
  var ethereum: ExternalProvider | undefined;
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
  if (network?.chainId === 137) {
    const feeData = await signer.getFeeData();
    if (feeData.gasPrice != null) {
      opts.gasPrice =
        Math.floor(feeData.gasPrice.toNumber() * 1.1) ?? undefined;
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
  tx: ContractTransaction
): Promise<MultiEventTransactionReceipt> {
  const receipt = await tx.wait();

  /* c8 ignore next */
  const events = receipt.events ?? [];
  const transactionHash = receipt.transactionHash;
  const blockNumber = receipt.blockNumber;
  const chainId = tx.chainId;
  const tableIds: string[] = [];
  for (const event of events) {
    const tableId =
      event.args?.tableId != null && event.args.tableId.toString();
    switch (event.event) {
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
export async function getSigner(external?: ExternalProvider): Promise<Signer> {
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
  const web3Provider = new Web3Provider(provider);
  return web3Provider.getSigner();
}

export {
  Signer,
  getDefaultProvider,
  type ExternalProvider,
  type ContractTransaction,
  type ContractReceipt,
};
