import {
  type TablelandTables,
  TablelandTables__factory as Factory,
} from "@tableland/evm";
import type { Overrides } from "ethers";
import { getOverrides, type Signer } from "../helpers/ethers.js";
import { validateTableName } from "../helpers/parser.js";
import { getContractAddress } from "../helpers/chains.js";

const connect = Factory.connect;

/**
 * TableIdentifier represents the information required to identify a table on the Tableland network.
 */
export interface TableIdentifier {
  /**
   * The target chain id.
   */
  chainId: number;
  /**
   * The target table id.
   */
  tableId: string;
}

async function getTableIdentifier(
  tableName: string | TableIdentifier
): Promise<TableIdentifier> {
  const { tableId, chainId } =
    typeof tableName === "string"
      ? await validateTableName(tableName)
      : tableName;
  return { tableId: tableId.toString(), chainId };
}

export async function getContractAndOverrides(
  signer: Signer,
  chainId: number
): Promise<{ contract: TablelandTables; overrides: Overrides }> {
  const address = getContractAddress(chainId);
  signer._checkProvider();
  const contract = connect(address, signer);
  const overrides = await getOverrides({ signer });
  return { contract, overrides };
}

export function assertChainId(actual: number, expected?: number): number {
  if (actual !== expected && expected != null) {
    throw new Error(
      `chain id mismatch: received ${actual}, expected ${expected}`
    );
  }
  return actual;
}

export async function getContractSetup(
  signer: Signer,
  tableName: string | TableIdentifier
): Promise<{
  contract: TablelandTables;
  overrides: Overrides;
  tableId: string;
}> {
  const { chainId: chain, tableId } = await getTableIdentifier(tableName);
  const chainId = await signer.getChainId();
  assertChainId(chainId, chain);
  const { contract, overrides } = await getContractAndOverrides(
    signer,
    chainId
  );
  return { contract, overrides, tableId };
}
