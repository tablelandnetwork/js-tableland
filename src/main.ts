import { registerTable } from "./lib/eth-calls";
import * as tablelandCalls from "./lib/tableland-calls";
import connect, { connectionCheck } from './lib/single';


async function createTable(query: string) {
  connectionCheck();
  // Validation
  // Check table name from query
  let registryTxn = await registerTable();
  tablelandCalls.createTable(query, registryTxn);
}

async function runQuery(query: string) : Promise<string> {
  connectionCheck();

  return await tablelandCalls.runQuery(query);
}

export {
  createTable,
  runQuery,
  connect
}