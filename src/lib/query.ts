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
  // make sure they query only contains a single statement, and includes a semicolon
  const statement = query.trim().split(";");
  if (statement.length !== 2 && statement[1] !== "") {
    throw new Error(
      "Invalid statement found in query. A Tableland query must be a single statement ending with a semicolon."
    );
  }

  // note: statement[0] is the query **without** the semicolon, this lets us split on `_` and still
  //       get the table id if the table name is the last word in the statement
  const tablenameMatches =
    statement[0].match(
      /\b(?:FROM|JOIN|UPDATE|INTO)\s+(\S+(?=\()|\S+(?:.\s)*)/i
    ) ?? []; // Find table name

  let tablename = tablenameMatches[1] ?? "";

  if (tablename[0] === '"') {
    tablename = tablename.slice(1);
  }
  if (tablename[tablename.length - 1] === '"') {
    tablename = tablename.slice(0, -1);
  }

  if (!tablename) {
    // If ID isn't a postive interger, throw error.
    throw new Error(
      "No table name identifier found in query. Tableland does not support sql statements that do not" +
        " include a specific table name identifier."
    );
  }

  const tablenameArray = tablename.split("_"); // Split tablename into chunks divided by _
  const tableId = tablenameArray[tablenameArray.length - 1]; // The find the last chunk, which should be ID

  if (!isPositiveInteger(tableId) && tablename !== "system_table") {
    // If ID isn't a postive interger, throw error.
    throw Error(
      "No ID found in query. Remember to add the table's ID after it's name. Ex; TableName_0000"
    );
  }

  return await tablelandCalls.query.call(this, query, tableId);
}
