import { registerTable } from "./lib/eth-calls";
import * as tablelandCalls from "./lib/tableland-calls";
import connect, { connectionCheck } from "./lib/single";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line no-unused-expressions
(globalThis as any).ethereum;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createTable(query: string): Promise<any> {
  connectionCheck();
  // Validation
  // Check table name from query
  /* const registryTxn = */ await registerTable();
  tablelandCalls.createTable(query /*, registryTxn */);
}

async function runQuery(query: string): Promise<string> {
  connectionCheck();

  return await tablelandCalls.runQuery(query);
}

export { createTable, runQuery, connect };
