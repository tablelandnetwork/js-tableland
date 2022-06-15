/**
 * Send a SQL query to tableland network
 * @param query A SQL query to run
 * @returns If read query, result-set. If write query, nothing.
 */

import { ReadQueryResult, WriteQueryResult, Connection } from "./connection.js";
import * as tablelandCalls from "./tableland-calls.js";

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
  return await tablelandCalls.write.call(this, query);
}
