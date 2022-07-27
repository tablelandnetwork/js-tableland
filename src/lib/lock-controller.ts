import { Connection, WriteQueryResult } from "./connection.js";
import * as ethCalls from "./eth-calls.js";
import { checkNetwork } from "./check-network.js";

/**
 * Set the Controller contract on a table
 * @returns {string} A Promise that resolves to ???.
 */
export async function lockController(
  this: Connection,
  tableName: string
): Promise<WriteQueryResult> {
  const tableId = tableName.trim().split("_").pop();
  if (typeof tableId !== "string") throw new Error("invalid tablename");
  const tableIdInt = parseInt(tableId, 10);
  if (isNaN(tableIdInt)) throw new Error("invalid tablename");

  // We check the wallet and tableland chains match here again in
  // case the user switched networks after creating a siwe token
  await checkNetwork.call(this);

  const txn = await ethCalls.lockController.call(this, tableIdInt);

  // match the response schema from the relay
  return { hash: txn.transactionHash };
}
