import { registerTable } from "./lib/eth-calls";
import * as tablelandCalls from "./lib/tableland-calls";
import connect from './lib/single';


async function createTable(query: string) {
  // Validation
  // Check table name from query
  let registryTxn = await registerTable();
  tablelandCalls.createTable(query, registryTxn);
}

async function runQuery(query: string) : Promise<string> {


  return await tablelandCalls.runQuery(query);
}


export {
  createTable,
  runQuery,
  connect
}