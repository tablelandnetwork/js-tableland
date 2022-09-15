/**
 * Send a SQL query to tableland network
 * @param query A SQL query to run
 * @returns If read query, result-set. If write query, nothing.
 */
import {
  ReadQueryResult,
  WriteQueryResult,
  Connection,
  ReadOptions,
  WriteOptions,
} from "./connection.js";
import * as tablelandCalls from "./tableland-calls.js";
import * as ethCalls from "./eth-calls.js";
import { shouldSkipConfirm, shouldRelay } from "./util.js";
import { checkNetwork } from "./check-network.js";

export function resultsToObjects({ rows, columns }: ReadQueryResult) {
  return rows.map((row: any[]) =>
    Object.fromEntries(row.map((k, i) => [columns[i].name, k]))
  );
}

export async function read(
  this: Connection,
  query: string,
  options?: ReadOptions
): Promise<ReadQueryResult> {
  return await tablelandCalls.read.call(this, query, options);
}

export async function write(
  this: Connection,
  query: string,
  options?: WriteOptions
): Promise<WriteQueryResult> {
  const skipConfirm = shouldSkipConfirm(options);
  const doRelay = shouldRelay(this, options);
  if (doRelay) {
    const response = await tablelandCalls.write.call(this, query);
    if (!skipConfirm) {
      const confirmation = await this.waitConfirm(response.hash);
      if (confirmation.error) throw new Error(confirmation.error);
    }

    return response;
  }

  // We check the wallet and tableland chains match here again in
  // case the user switched networks after creating a siwe token
  await checkNetwork.call(this);

  // ask the Validator if this query is valid, and get the tableId for use in SC call
  const { tableId } = await tablelandCalls.validateWriteQuery.call(this, query);

  const txn = await ethCalls.runSql.call(this, tableId, query);
  if (!skipConfirm) {
    const confirmation = await this.waitConfirm(txn.transactionHash);
    if (confirmation.error) throw new Error(confirmation.error);
  }

  return { hash: txn.transactionHash };
}
