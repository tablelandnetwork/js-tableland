import { type SignerConfig } from "../helpers/config.js";
import { type ContractTransaction } from "../helpers/ethers.js";
import { validateTableName } from "../helpers/parser.js";
import {
  getContractAndOverrides,
  TableIdentifier,
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

export async function prepareRunSQL({
  statement,
  chainId,
  first,
}: PrepareParams): Promise<RunSQLParams & { prefix: string }> {
  const { tableId, prefix, chainId: chain } = await validateTableName(first);
  assertChainId(chain, chainId);
  return { tableId: tableId.toString(), statement, prefix, chainId };
}

export interface RunSQLParams extends TableIdentifier {
  /**
   * SQL statement string.
   */
  statement: string;
}

export async function runSQL(
  { signer }: SignerConfig,
  { statement, tableId, chainId }: RunSQLParams
): Promise<ContractTransaction> {
  const caller = await signer.getAddress();
  const { contract, overrides } = await getContractAndOverrides(
    signer,
    chainId
  );
  return await contract.runSQL(caller, tableId, statement, overrides);
}
