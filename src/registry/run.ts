import { Typed } from "ethers";
import { type SignerConfig } from "../helpers/config.js";
import { type ContractTransactionResponse } from "../helpers/index.js";
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

export async function prepareMutateOne({
  statement,
  chainId,
  first,
}: PrepareParams): Promise<RunSQLParams & { prefix: string }> {
  const { tableId, prefix, chainId: chain } = await validateTableName(first);
  assertChainId(chain, chainId);
  return { tableId: tableId.toString(), statement, prefix, chainId };
}

export interface MutateOneParams extends TableIdentifier {
  /**
   * SQL statement string.
   */
  statement: string;
}

/**
 * Runnable represents an Object the will be used as a Runnable struct in the
 * call to the contract's `mutate` function.
 * @typedef {Object} Runnable
 * @property {string} statement - SQL statement string.
 * @property {number} chainId - The target chain id.
 */
export interface Runnable {
  statement: string;
  tableId: number;
}

/**
 * MutateManyParams Represents the parameters Object used to mutate multiple tables in a single tx.
 * @typedef {Object} MutateManyParams
 * @property {Runnable[]} runnables - List of Runnables.
 * @property {number} chainId - The target chain id.
 */
export interface MutateManyParams {
  runnables: Runnable[];
  chainId: number;
}

export type MutateParams = MutateOneParams | MutateManyParams;

export async function mutate(
  config: SignerConfig,
  params: MutateParams
): Promise<ContractTransactionResponse> {
  if (isMutateOne(params)) {
    return await _mutateOne(config, params);
  }

  return await _mutateMany(config, params);
}

async function _mutateOne(
  { signer }: SignerConfig,
  { statement, tableId, chainId }: MutateOneParams
): Promise<ContractTransactionResponse> {
  const caller = await signer.getAddress();
  const { contract, overrides } = await getContractAndOverrides(
    signer,
    chainId
  );
  return await contract.mutate(
    Typed.address(caller),
    Typed.uint256(tableId),
    Typed.string(statement),
    overrides
  );
}

async function _mutateMany(
  { signer }: SignerConfig,
  { runnables, chainId }: MutateManyParams
): Promise<ContractTransactionResponse> {
  const caller = await signer.getAddress();
  const { contract, overrides } = await getContractAndOverrides(
    signer,
    chainId
  );
  return await contract.mutate(
    Typed.address(caller),
    Typed.array(
      runnables.map(function (runnable) {
        return {
          statement: Typed.string(runnable.statement),
          tableId: Typed.uint256(runnable.tableId),
        };
      })
    ),
    overrides
  );
}

const isMutateOne = function (params: MutateParams): params is MutateOneParams {
  return (params as MutateOneParams).statement !== undefined;
};
