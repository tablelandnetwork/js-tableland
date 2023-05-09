import { Typed } from "ethers";
import { type SignerConfig } from "../helpers/config.js";
import { type ContractTransactionResponse } from "../helpers/ethers.js";
import { type TableIdentifier, getContractSetup } from "./contract.js";

export interface TransferParams {
  /**
   * Name or tableId and chainId of the token to be transferred.
   */
  tableName: string | TableIdentifier;
  /**
   * Address to receive the ownership of the given token ID.
   */
  to: string;
}

export async function safeTransferFrom(
  { signer }: SignerConfig,
  params: TransferParams
): Promise<ContractTransactionResponse> {
  const { contract, overrides, tableId } = await getContractSetup(
    signer,
    params.tableName
  );
  const caller = await signer.getAddress();
  return await contract.safeTransferFrom(
    Typed.address(caller),
    Typed.address(params.to),
    Typed.uint256(tableId),
    overrides
  );
}
