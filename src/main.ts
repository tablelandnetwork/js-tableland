/* eslint-disable node/no-missing-import */
import { registerTable } from "./lib/eth-calls.js";
import * as tablelandCalls from "./lib/tableland-calls.js";
import { connect, connectionCheck } from "./lib/single.js";
import { CreateTableOptions } from "./lib/tableland-calls.js";

function isPositiveInteger(n: any) {
  return n >>> 0 === parseFloat(n);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line no-unused-expressions
(globalThis as any).ethereum;

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
  const createTableReceipt = await tablelandCalls.createTable(
    query,
    tableId,
    options
  );
  return {
    id: tableId,
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
    query.match(/\b(?:FROM|JOIN|UPDATE|INTO)\s+(\w+(?:.\w+)*)/) ?? []; // Find table name
  const tablenameArray = tablename[1].split("_"); // Split tablename into chunks divided by _
  const tableId = tablenameArray[tablenameArray.length - 1]; // The find the last chunk, which should be ID

  if (!isPositiveInteger(tableId)) {
    // If ID isn't a postive interger, throw error.
    throw Error(
      "No ID found in query. Remember to add the table's ID after it's name. Ex; TableName_0000"
    );
  }

  return await tablelandCalls.runQuery(query, tableId);
}

export { createTable, runQuery, connect };
export { myTables } from "./lib/tableland-calls.js";
export { ConnectionReceipt, ConnectionOptions, Token } from "./lib/single.js";
export {
  Column,
  ColumnDescriptor,
  Row,
  ReadQueryResult,
  TableMetadata,
  CreateTableOptions,
  CreateTableReceipt,
} from "./lib/tableland-calls.js";