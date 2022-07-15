import { Connection } from "./connection.js";
//import * as tablelandCalls from "./tableland-calls.js";
import * as ethCalls from "./eth-calls.js";

/**
 * Set the Controller contract on a table
 * @returns {string} A Promise that resolves to ???.
 */
export async function getController(
  this: Connection,
  tableName: string
): Promise<string> {
  const tableId = tableName.trim().split("_").pop();
  if (typeof tableId !== "string") throw new Error("malformed tablename");

  // TODO: do we need to enable rpcRelay?
  //       It's a read so I don't see any point aside from having a more robust rpc api
  //if (this.options.rpcRelay) {
    //// Note that since tablelandCalls all use the token, the networks are matched during token creation
    //return await tablelandCalls.getController.call(this, tableId);
  //}

  const tableIdInt = parseInt(tableId, 10);
  if (isNaN(tableIdInt)) throw new Error("invalid tableId was provided");

  return await ethCalls.getController.call(this, tableIdInt);
}
