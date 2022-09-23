import { Connection, WriteQueryResult, SetControllerOptions } from "./connection.js";
/**
 * Set the Controller contract on a table
 * @returns {string} A Promise that resolves to ???.
 */
export declare function setController(this: Connection, controller: string, name: string, options?: SetControllerOptions): Promise<WriteQueryResult>;
