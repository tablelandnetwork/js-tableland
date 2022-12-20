import { type SignerConfig } from "../helpers/connection.js";
import { type ContractTransaction } from "../helpers/ethers.js";
import { type TableIdentifier, getContractSetup } from "./contract.js";

export interface Params {
  tableName: string | TableIdentifier;
  to: string;
}

export async function safeTransferFrom(
  { signer }: SignerConfig,
  params: Params
): Promise<ContractTransaction> {
  const { contract, overrides, tableId } = await getContractSetup(
    signer,
    params.tableName
  );
  const caller = await signer.getAddress();
  return await contract["safeTransferFrom(address,address,uint256)"](
    caller,
    params.to,
    tableId,
    overrides
  );
}
