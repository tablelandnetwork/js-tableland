import {
  type TransactionReceipt,
  pollTransactionReceipt,
} from "../validator/receipt.js";
import { type SignalAndInterval, type Wait } from "../helpers/await.js";
import {
  type Config,
  type ReadConfig,
  extractBaseUrl,
  extractChainId,
} from "../helpers/config.js";
import {
  type ContractTransaction,
  getContractReceipt,
} from "../helpers/ethers.js";
import { validateTables, type StatementType } from "../helpers/parser.js";
// import { type Runnable } from "./run.js";

/**
 * UnnamedWaitableTransactionReceipt represents a TransactionReceipt with a wait method, but no name.
 */
export type UnnamedWaitableTransactionReceipt = TransactionReceipt &
  Wait<TransactionReceipt>;

/**
 * WaitableTransactionReceipt represents a named TransactionReceipt with a wait method.
 */
export type WaitableTransactionReceipt = TransactionReceipt &
  Wait<TransactionReceipt & Named> &
  Named;

/**
 * Named represents a named table with a prefix.
 */
export interface Named {
  /**
   * Full table name.
   */
  name: string;
  /**
   * Table name prefix.
   */
  prefix: string;
}

/**
 * ExtractedStatement represents a SQL statement string with the type and tables extracted.
 */
export interface ExtractedStatement {
  /**
   * SQL statement string.
   */
  sql: string;
  /**
   * List of table names referenced within the statement.
   */
  tables: string[];
  /**
   * The statement type. Must be one of "read", "write", "create", or "acl".
   */
  type: StatementType;
}

function isTransactionReceipt(arg: any): arg is WaitableTransactionReceipt {
  return (
    !Array.isArray(arg) &&
    arg.transactionHash != null &&
    arg.tableId != null &&
    arg.chainId != null &&
    arg.blockNumber != null &&
    typeof arg.wait === "function"
  );
}

export function wrapResult<T = unknown>(
  resultsOrReceipt: T[] | WaitableTransactionReceipt,
  duration: number
): Result<T> {
  const meta: Metadata = { duration };
  const result: Result<T> = {
    meta,
    success: true,
    results: [],
  };
  if (isTransactionReceipt(resultsOrReceipt)) {
    return { ...result, meta: { ...meta, txn: resultsOrReceipt } };
  }
  return { ...result, results: resultsOrReceipt };
}

/**
 * Metadata represents meta information about an executed statement/transaction.
 */
export interface Metadata {
  /**
   * Total client-side duration of the async call.
   */
  duration: number;
  /**
   * The optional transactionn information receipt.
   */
  txn?: WaitableTransactionReceipt;
  /**
   * Metadata may contrain additional arbitrary key/values pairs.
   */
  [key: string]: any;
}

/**
 * Result represents the core return result for an executed statement.
 */
export interface Result<T = unknown> {
  /**
   * Possibly empty list of query results.
   */
  results: T[];
  /**
   * Whether the query or transaction was successful.
   */
  success: boolean; // almost always true
  /**
   * If there was an error, this will contain the error string.
   */
  error?: string;
  /**
   * Additional meta information.
   */
  meta: Metadata;
}

export async function extractReadonly(
  conn: Config,
  { tables, type }: Omit<ExtractedStatement, "sql">
): Promise<ReadConfig> {
  const [{ chainId }] = await validateTables({ tables, type });
  const baseUrl = await extractBaseUrl(conn, chainId);
  return { baseUrl };
}

export async function wrapTransaction(
  conn: Config,
  prefix: string,
  tx: ContractTransaction
): Promise<WaitableTransactionReceipt> {
  const _params = await getContractReceipt(tx);
  const chainId =
    _params.chainId === 0 || _params.chainId == null
      ? await extractChainId(conn)
      : _params.chainId;
  const name = `${prefix}_${chainId}_${_params.tableId}`;
  const params = { ..._params, chainId };
  const wait = async (
    opts: SignalAndInterval = {}
  ): Promise<TransactionReceipt & Named> => {
    const receipt = await pollTransactionReceipt(conn, params, opts);
    if (receipt.error != null) {
      throw new Error(receipt.error);
    }
    return { ...receipt, name, prefix };
  };
  return { ...params, wait, name, prefix };
}

export async function wrapBatch(
  conn: Config,
  tx: ContractTransaction
): Promise<UnnamedWaitableTransactionReceipt> {
  const _params = await getContractReceipt(tx);
  const chainId =
    _params.chainId === 0 || _params.chainId == null
      ? await extractChainId(conn)
      : _params.chainId;
  const params = { ..._params, chainId };

  const wait = async (
    opts: SignalAndInterval = {}
  ): Promise<TransactionReceipt> => {
    const receipt = await pollTransactionReceipt(conn, params, opts);
    if (receipt.error != null) {
      throw new Error(receipt.error);
    }
    console.log("receipt", receipt);
    // TODO: We are doing a Batch so `name`, `prefix`, or `tableId` only exist for
    //       each statement in the batch.  Should we map them back to the statements?
    return receipt;
  };

  return { ...params, wait };
}
