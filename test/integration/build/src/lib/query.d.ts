/**
 * Send a SQL query to tableland network
 * @param query A SQL query to run
 * @returns If read query, result-set. If write query, nothing.
 */
import { ReadQueryResult, WriteQueryResult, Connection, ReadOptions, WriteOptions } from "./connection.js";
export declare function resultsToObjects({ rows, columns }: ReadQueryResult): {
    [k: string]: any;
}[];
export declare function read(this: Connection, query: string, options?: ReadOptions): Promise<ReadQueryResult>;
export declare function write(this: Connection, query: string, options?: WriteOptions): Promise<WriteQueryResult>;
