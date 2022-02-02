/* eslint-disable node/no-missing-import */
import { registerTable } from "./lib/eth-calls.js";
import * as tablelandCalls from "./lib/tableland-calls.js";
import connect, { connectionCheck } from "./lib/single.js";
// import { v4 } from "uuid";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line no-unused-expressions
(globalThis as any).ethereum;

interface TableMeta {
  id: string;
  name?: string;
  fullName?: string;
}

/**
 * Registers an NFT with the Ethereum smart contract, then uses that to register
 * a new Table on Tableland
 * @param query An SQL create statement
 * @returns {string} The token ID of the table created
 */
async function createTable(query: string, options: any): Promise<TableMeta> {
  connectionCheck();

  const authorized = await tablelandCalls.checkAuthorizedList();
  if (!authorized) throw new Error("You are not authorized to create a table");
  // Validation
  const { tableId } = await registerTable();
  tablelandCalls.createTable(query, tableId, options);
  return {
    id: tableId,
  };
}

/**
 *
 * @param query A SQL query to run
 * @param tableId The token ID of the table which the query should be run against
 * @returns Table if read query, nothing if write query
 */
async function runQuery(
  query: string,
  tableId: string
): Promise<tablelandCalls.ReadQueryResult | null> {
  connectionCheck();
  console.log(`Running query "${query}" against token ${tableId}`);
  return await tablelandCalls.runQuery(query, tableId);
}

export { createTable, runQuery, connect };
export { myTables } from "./lib/tableland-calls.js";
export { Authenticator, ConnectionDetails, Token } from "./lib/single.js";
export {
  Column,
  ColumnDescriptor,
  Row,
  ReadQueryResult,
} from "./lib/tableland-calls.js";
