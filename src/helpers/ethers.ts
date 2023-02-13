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

export type RegistryReceipt = Required<
  Omit<TransactionReceipt, "error" | "errorEventIdx">
>;

export async function getContractReceipt(
  tx: ContractTransaction
): Promise<RegistryReceipt> {
  const receipt = await tx.wait();
  /* c8 ignore next */
  const events = receipt.events ?? [];
  const transactionHash = receipt.transactionHash;
  const blockNumber = receipt.blockNumber;
  const chainId = tx.chainId;
  let tableId: string = "";
  for (const event of events) {
    switch (event.event) {
      case "CreateTable":
      case "RunSQL":
        tableId = event.args?.tableId.toString();
        break;
      default:
      // Could be a Transfer or other
    }
    // Break on first case of finding a tableId
    if (tableId !== "") {
      break;
    }
  }
  return { tableId, transactionHash, blockNumber, chainId };
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
