/* eslint-disable node/no-missing-import */
import { registerTable } from "./lib/eth-calls";
import * as tablelandCalls from "./lib/tableland-calls";
import { connect, connectionCheck } from "./lib/single";
import { CreateTableOptions } from "./lib/tableland-calls";
import { BigNumber } from "ethers";

import { myTables } from "./lib/myTables";

function isPositiveInteger(n: any) {
  return n >>> 0 === parseFloat(n);
}

export interface TableMeta {
  id: string;
  name?: string;
  fullName?: string;
}
// TODO: Potentially merge TableMeta and CreateTableReceipt

/**
 * Registers an NFT with the Tableland Ethereum smart contract, then uses that to register
 * a new Table on Tableland
 * @param {string} query SQL create statement. Must include 'id' as primary key.
 * @param {CreateTableOptions} options List of options
 * @returns {string} The token ID of the table created
 */
async function createTable(
  query: string,
  options: CreateTableOptions = {}
): Promise<TableMeta> {
  connectionCheck();

  const authorized = await tablelandCalls.checkAuthorizedList();
  if (!authorized) throw new Error("You are not authorized to create a table");
  // Validation
  const { tableId } = await registerTable();
  const normalizedId = BigNumber.from(tableId).toString();
  const createTableReceipt = await tablelandCalls.createTable(
    query,
    normalizedId,
    options
  );
  return {
    id: createTableReceipt.id,
    name: createTableReceipt.name,
  };
}

/**
 * Send a SQL query to tableland network
 * @param query A SQL query to run
 * @returns If read query, result-set. If write query, nothing.
 */
async function runQuery(
  query: string
): Promise<tablelandCalls.ReadQueryResult | null> {
  connectionCheck(); // Check that the client has already connected to their signer
  const tablename =
    query.match(/\b(?:FROM|JOIN|UPDATE|INTO)\s+(\S+(?:.\s)*)/) ?? []; // Find table name
  const tablenameArray = tablename[1].split("_t"); // Split tablename into chunks divided by _
  const tableId = tablenameArray[tablenameArray.length - 1]; // The find the last chunk, which should be ID

  if (!isPositiveInteger(tableId) && tablename[1]==="system_table") {
    // If ID isn't a postive interger, throw error.
    throw Error(
      "No ID found in query. Remember to add the table's ID after it's name. Ex; TableName_0000"
    );
  }

  return await tablelandCalls.runQuery(query, tableId);
}
export { createTable, runQuery, connect, myTables };
export { ConnectionReceipt, ConnectionOptions, Token } from "./lib/single";
export {
  Column,
  ColumnDescriptor,
  Row,
  ReadQueryResult,
  TableMetadata,
  CreateTableOptions,
  CreateTableReceipt,
} from "./lib/tableland-calls";
