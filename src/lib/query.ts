/**
 * Send a SQL query to tableland network
 * @param query A SQL query to run
 * @returns If read query, result-set. If write query, nothing.
 */

import { ReadQueryResult, Connection } from "../interfaces.js";
import * as tablelandCalls from "./tableland-calls.js";

function isPositiveInteger(n: any) {
  return n >>> 0 === parseFloat(n);
}

export async function query(
  this: Connection,
  query: string
): Promise<ReadQueryResult | null> {
  const tablename =
    query.match(/\b(?:FROM|JOIN|UPDATE|INTO)\s+(\S+(?:.\s)*)/) ?? []; // Find table name
  const tablenameArray = tablename[1].split("_"); // Split tablename into chunks divided by _
  const tableId = tablenameArray[tablenameArray.length - 1]; // The find the last chunk, which should be ID

  if (!isPositiveInteger(tableId) && tablename[1] === "system_table") {
    // If ID isn't a postive interger, throw error.
    throw Error(
      "No ID found in query. Remember to add the table's ID after it's name. Ex; TableName_0000"
    );
  }

  return await tablelandCalls.query.call(this, query, tableId);
}
