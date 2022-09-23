import { StructureHashResult, Connection, HashOptions } from "./connection.js";
/**
 * Takes a Create Table SQL statement and returns the structure hash that would be generated
 * @param {string} schema The schema component of a SQL CREATE statement. See `create` for details.
 * @param {string} prefix The table name prefix.
 * @returns {string} The structured hash of the table that would be created.
 */
export declare function hash(this: Connection, schema: string, options?: HashOptions): Promise<StructureHashResult>;
