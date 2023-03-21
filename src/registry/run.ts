import { type SignerConfig } from "../helpers/config.js";
import { type ContractTransaction } from "../helpers/ethers.js";
import { validateTableName } from "../helpers/parser.js";
import {
  getContractAndOverrides,
  type TableIdentifier,
  assertChainId,
} from "./contract.js";

export interface PrepareParams {
  /**
   * SQL statement string.
   */
  statement: string;
  /**
   * The target chain id.
   */
  chainId: number;
  /**
   * The first table name in a series of SQL statements.
   */
  first: string;
}

export async function prepareWriteToTable({
  statement,
  chainId,
  first,
}: PrepareParams): Promise<RunSQLParams & { prefix: string }> {
  const { tableId, prefix, chainId: chain } = await validateTableName(first);
  assertChainId(chain, chainId);
  return { tableId: tableId.toString(), statement, prefix, chainId };
}

export interface WriteToTableParams extends TableIdentifier {
  /**
   * SQL statement string.
   */
  statement: string;
}

/**
 * @custom deprecated This type will change in the next major version.
 * Use the `WriteToTableParams` type.
 */
export interface RunSQLParams extends TableIdentifier {
  /**
   * SQL statement string.
   */
  statement: string;
}

export interface Runnable {
  statement: string;
  tableId: number;
}

/**
 * @custom deprecated This is a temporary type that will be removed
 */
export interface RunSQLsParams extends TableIdentifier {
  /**
   * SQL statement string.
   */
  runnables: Runnable[];
}

export async function writeToTable(
  { signer }: SignerConfig,
  { statement, tableId, chainId }: RunSQLParams
): Promise<ContractTransaction> {
  const caller = await signer.getAddress();
  const { contract, overrides } = await getContractAndOverrides(
    signer,
    chainId
  );
  return await contract.writeToTable(caller, tableId, statement, overrides);
}

export async function runSQL(
  { signer }: SignerConfig,
  { runnables, chainId }: RunSQLsParams
): Promise<ContractTransaction> {
  const caller = await signer.getAddress();
  const { contract, overrides } = await getContractAndOverrides(
    signer,
    chainId
  );
  return await contract.runSQL(caller, runnables, overrides);
}
