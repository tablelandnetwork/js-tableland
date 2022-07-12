import { StructureHashResult, Connection } from "./connection.js";
import * as tablelandCalls from "./tableland-calls.js";
/**
 * Takes a Create Table SQL statement and returns the structure hash that would be generated
 * @param {string} schema The schema component of a SQL CREATE statement. See `create` for details.
 * @param {string} prefix The table name prefix.
 * @returns {string} The structured hash of the table that would be created.
 */
export async function hash(
  this: Connection,
  schema: string,
  prefix: string = ""
): Promise<StructureHashResult> {
  const { chainId } = this.options;
  const query = `CREATE TABLE ${prefix}_${chainId} (${schema});`;
  return await tablelandCalls.hash.call(this, query);
}
