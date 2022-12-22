import {
  type TransactionReceipt,
  pollTransactionReceipt,
} from "../validator/receipt.js";
import { type SignalAndInterval, type Wait } from "../helpers/await.js";
import {
  type Config,
  type ReadConfig,
  extractBaseUrl,
} from "../helpers/config.js";
import {
  type ContractTransaction,
  getContractReceipt,
} from "../helpers/ethers.js";
import { validateTables, type StatementType } from "../helpers/parser.js";

export type WaitableTransactionReceipt = TransactionReceipt &
  Wait<TransactionReceipt & Named> &
  Named;

export interface Named {
  name: string;
  prefix: string;
}

export interface ExtractedStatement {
  sql: string;
  tables: string[];
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

export interface Metadata {
  duration: number;
  txn?: WaitableTransactionReceipt;
  [key: string]: any;
}

export interface Result<T = unknown> {
  results: T[];
  success: boolean; // almost always true
  error?: string;
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
  conn: ReadConfig,
  prefix: string,
  tx: ContractTransaction
): Promise<WaitableTransactionReceipt> {
  const params = await getContractReceipt(tx);
  const name = `${prefix}_${params.chainId}_${params.tableId}`;
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
