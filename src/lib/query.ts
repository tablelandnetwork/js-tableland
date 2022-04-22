/**
 * Send a SQL query to tableland network
 * @param query A SQL query to run
 * @returns If read query, result-set. If write query, nothing.
 */

import { ReadQueryResult, Connection } from "../interfaces.js";
import * as tablelandCalls from "./tableland-calls.js";

export async function query(
  this: Connection,
  query: string
): Promise<ReadQueryResult | null> {
  return await tablelandCalls.query.call(this, query);
}
