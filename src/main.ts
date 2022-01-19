import { registerTable } from "./lib/eth-calls.js";
import * as tablelandCalls from "./lib/tableland-calls.js";
import connect, { connectionCheck } from "./lib/single.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line no-unused-expressions
(globalThis as any).ethereum;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createTable(query: string): Promise<any> {
  connectionCheck();

  // Validation
  const { tableId } = await registerTable();
  tablelandCalls.createTable(query, tableId);
  return tableId;
}

async function runQuery(query: string, tableId: string): Promise<object> {
  connectionCheck();
  console.log(`Running query "${query}" against token ${tableId}`);
  return await tablelandCalls.runQuery(query, tableId);
}

export { createTable, runQuery, connect };
export { myTables } from "./lib/tableland-calls.js";
export { Authenticator, ConnectionDetails, Token } from "./lib/single.js";
export { Column, ColumnDescriptor, Row, Table } from "./lib/tableland-calls.js";
