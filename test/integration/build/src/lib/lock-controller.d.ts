import { Connection, WriteQueryResult } from "./connection.js";
/**
 * Set the Controller contract on a table
 * @returns {string} A Promise that resolves to ???.
 */
export declare function lockController(this: Connection, tableName: string): Promise<WriteQueryResult>;
