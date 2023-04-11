import {
  type TransactionReceipt,
  pollTransactionReceipt,
} from "../validator/receipt.js";
import { type Runnable } from "../registry/index.js";
import { normalize } from "../helpers/index.js";
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

// This function takes config, a table name prefix and the transaction that created a table
// and returns the actual table name.
// TODO: this will only work for a transactions that touch a single table, and since a single transaction
//       can touch multiple tables, we either need a another method for multiple, or rewrite
//       this to be more general.  NOTE: the ability to touch multiple tables on a singel transaction has existed
//       for many months, so this is not a new feature

// TODO: this feels complicated enough that we should add comments explaining what it does
export async function wrapTransaction(
  conn: Config,
  prefix: string, // TODO: we either need another method, or this needs to be a list of prefixes...
  tx: ContractTransaction
): Promise<WaitableTransactionReceipt> {
  // TODO: `getContractReceipt` is ignoring all but the first tableID
  // tableIds, transactionHash, blockNumber, chainId
  const _params = await getContractReceipt(tx);
  const chainId =
    _params.chainId === 0 || _params.chainId == null
      ? await extractChainId(conn)
      : _params.chainId;
  const name = `${prefix}_${chainId}_${_params.tableIds[0]}`;
  const params = { ..._params, chainId, tableId: _params.tableIds[0] };
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

interface MultiEventTransaction {
  names: string[];
  prefixes: string[];
}

/* A helper function for mapping contract event receipts to table data
 *
 * @param {conn} a database config object
 * @param {statements} either the sql statement strings or the nomralized statement objects that were used in the transaction
 * @param {tx} the transaction object
 * @returns {
 *    names: Array of table names the correspond to the statements. Useful for create statements
 *    wait: a function that will only return successfully after the conencted validator confirms the tx
 *
 *    TODO: kind of hard to figure out what else should go here because the type is inherited more than many levels deep
 *          but also feels important to have this info in the comments for readability
 * }
 *
 */
export async function wrapManyTransaction(
  conn: Config,
  statements: string[] | Runnable[],
  tx: ContractTransaction
): Promise<WaitableTransactionReceipt & MultiEventTransaction> {
  // TODO: `getContractReceipt` is ignoring all but the first tableID
  const _params = await getContractReceipt(tx);
  const chainId =
    _params.chainId === 0 || _params.chainId == null
      ? await extractChainId(conn)
      : _params.chainId;

  // TODO: this was returning a `name` property, but there is potentiall more than one name.
  //    We should probably continue to return `name` so we can keep backward compatability,
  //    but we also should include `names` as a full list of the names for this tx.

  // map the transaction events to table names and prefixes then return them to the caller
  const { names, prefixes } = (
    await Promise.all(
      _params.tableIds.map(async function (tableId: string, i: number) {
        const statementString = isRunnable(statements[i])
          ? (statements[i] as Runnable).statement
          : (statements[i] as string);
        const normalized = await normalize(statementString);

        if (normalized.type === "create") {
          return {
            name: `${normalized.tables[0]}_${chainId}_${tableId}`,
            prefix: normalized.tables[0],
          };
        }
        return {
          name: normalized.tables[0],
          prefix: normalized.tables[0].split("_").slice(0, -2).join("_"),
        };
      })
    )
  ).reduce<{ prefixes: string[]; names: string[] }>(
    function (acc, cur) {
      acc.prefixes.push(cur.prefix);
      acc.names.push(cur.name);
      return acc;
    },
    { prefixes: [], names: [] }
  );

  const params = { ..._params, chainId };
  const wait = async (
    opts: SignalAndInterval = {}
  ): Promise<TransactionReceipt & Named & MultiEventTransaction> => {
    const receipt = await pollTransactionReceipt(conn, params, opts);
    if (receipt.error != null) {
      throw new Error(receipt.error);
    }
    // TODO: including `name`, `prefix`, and `tableId` for back compat, will be removed next major
    return {
      ...receipt,
      names,
      name: names[0],
      tableId: _params.tableIds[0],
      prefixes,
      prefix: prefixes[0],
    };
  };
  // TODO: including `name`, `prefix`, and `tableId` for back compat, will be removed next major
  return {
    ...params,
    wait,
    names,
    name: names[0],
    tableId: _params.tableIds[0],
    prefixes,
    prefix: prefixes[0],
  };
}

// TODO: where should this helper live?
function isRunnable(statement: string | Runnable): statement is Runnable {
  return (statement as Runnable).tableId !== undefined;
}
