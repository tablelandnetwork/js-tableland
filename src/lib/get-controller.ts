import { Connection } from "./connection.js";
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

  const tableIdInt = parseInt(tableId, 10);
  if (isNaN(tableIdInt)) throw new Error("invalid tableId was provided");

  return await ethCalls.getController.call(this, tableIdInt);
}
