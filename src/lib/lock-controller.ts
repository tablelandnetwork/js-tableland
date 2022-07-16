import { Connection, WriteQueryResult } from "./connection.js";
import * as tablelandCalls from "./tableland-calls.js";
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

  // TODO: Validator RPC does not support this yet
  if (this.options.rpcRelay) {
    // Note that since tablelandCalls all use the token, the networks are matched during token creation
    return await tablelandCalls.lockController.call(this, tableId);
  }

  // We check the wallet and tableland chains match here again in
  // case the user switched networks after creating a siwe token
  await checkNetwork.call(this);

  const txn = await ethCalls.lockController.call(this, tableIdInt);

  // match the response schema from the relay
  return { hash: txn.transactionHash };
}
