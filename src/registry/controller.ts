import { Typed } from "ethers";
import { type SignerConfig } from "../helpers/config.js";
import { type ContractTransactionResponse } from "../helpers/ethers.js";
import { type TableIdentifier, getContractSetup } from "./contract.js";

export interface SetParams {
  /**
   * Name or tableId and chainId of the token to be transferred.
   */
  tableName: string | TableIdentifier;
  /**
   * Address of the contract to use as a controller.
   */
  controller: string;
}

export async function setController(
  { signer }: SignerConfig,
  params: SetParams
): Promise<ContractTransactionResponse> {
  const { contract, overrides, tableId } = await getContractSetup(
    signer,
    params.tableName
  );
  const caller = await signer.getAddress();
  const controller = params.controller;
  return await contract.setController(
    Typed.address(caller),
    Typed.uint256(tableId),
    Typed.address(controller),
    overrides
  );
}

export async function lockController(
  { signer }: SignerConfig,
  tableName: string | TableIdentifier
): Promise<ContractTransactionResponse> {
  const { contract, overrides, tableId } = await getContractSetup(
    signer,
    tableName
  );
  const caller = await signer.getAddress();
  return await contract.lockController(
    Typed.address(caller),
    Typed.uint256(tableId),
    overrides
  );
}

export async function getController(
  { signer }: SignerConfig,
  tableName: string | TableIdentifier
): Promise<string> {
  const { contract, overrides, tableId } = await getContractSetup(
    signer,
    tableName
  );
  return await contract.getController(Typed.uint256(tableId), overrides);
}
