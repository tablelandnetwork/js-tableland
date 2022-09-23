import { SchemaQueryResult, Connection } from "./connection.js";
export declare function schema(this: Connection, tableName: string): Promise<SchemaQueryResult>;
