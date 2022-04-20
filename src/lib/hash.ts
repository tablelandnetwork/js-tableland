/* eslint-disable node/no-unpublished-import */
import { StructureHashReceipt, Connection } from "../interfaces.js";
import * as tablelandCalls from "./tableland-calls.js";
/**
 * Takes a Create Table SQL statement and returns the structure hash that would be generated
 * @param {string} query SQL create statement. Must include 'id' as primary key.
 * @returns {string} The structure has of the table that would be created
 */
export async function hash(
  this: Connection,
  query: string
): Promise<StructureHashReceipt> {
  return await tablelandCalls.hash.call(this, query);
}
