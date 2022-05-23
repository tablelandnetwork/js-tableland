/**
 * Send a SQL query to tableland network
 * @param query A SQL query to run
 * @returns If read query, result-set. If write query, nothing.
 */

import {
  ReadQueryResult,
  WriteQueryResult,
  Connection,
} from "../interfaces.js";
import * as tablelandCalls from "./tableland-calls.js";

export async function read(
  this: Connection,
  query: string
): Promise<ReadQueryResult | null> {
  return await tablelandCalls.read.call(this, query);
}

export async function write(
  this: Connection,
  query: string
): Promise<WriteQueryResult | null> {
  return await tablelandCalls.write.call(this, query);
}
