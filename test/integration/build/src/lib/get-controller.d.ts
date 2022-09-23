import { Connection } from "./connection.js";
/**
 * Set the Controller contract on a table
 * @returns {string} A Promise that resolves to ???.
 */
export declare function getController(this: Connection, tableName: string): Promise<string>;
