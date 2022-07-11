/**
 * Send a SQL query to tableland network
 * @param query A SQL query to run
 * @returns If read query, result-set. If write query, nothing.
 */

import { ReadQueryResult, WriteQueryResult, Connection } from "./connection.js";
import * as tablelandCalls from "./tableland-calls.js";
import { runSql } from "./eth-calls.js";

export function resultsToObjects({ rows, columns }: ReadQueryResult) {
  return rows.map((row: any[]) =>
    Object.fromEntries(row.map((k, i) => [columns[i].name, k]))
  );
}

export async function read(
  this: Connection,
  query: string
): Promise<ReadQueryResult> {
  return await tablelandCalls.read.call(this, query);
}

export async function write(
  this: Connection,
  query: string
): Promise<WriteQueryResult> {
  if (this.options.rpcRelay) {
    return await tablelandCalls.write.call(this, query);
  }

  // ask the Validator if this query is valid, and get the tableId for use in SC call
  const { tableId } = await tablelandCalls.validateWriteQuery.call(this, query);

  const txn = await runSql.call(this, tableId, query);

  return { hash: txn.transactionHash };
}
