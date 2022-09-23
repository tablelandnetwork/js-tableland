import { StructureHashResult, ValidateWriteResult, ReadQueryResult, WriteQueryResult, ReceiptResult, Connection, ReadOptions } from "./connection.js";
import { list } from "./list.js";
export interface ValidateCreateTableParams {
    create_statement: string;
}
export interface ValidateWriteQueryParams {
    statement: string;
}
export interface RunReadQueryParams {
    statement: string;
}
export interface RelayWriteQueryParams {
    statement: string;
}
export interface GetReceiptParams {
    txn_hash: string;
}
export interface SetControllerParams {
    controller: string;
    caller: string;
    token_id: string;
}
export interface LockControllerParams {
    token_id: string;
}
export interface RpcReceipt<T = any> {
    jsonrpc: string;
    id: number;
    result: T;
}
declare function hash(this: Connection, query: string): Promise<StructureHashResult>;
declare function validateWriteQuery(this: Connection, query: string): Promise<ValidateWriteResult>;
declare function read(this: Connection, query: string, options?: ReadOptions): Promise<ReadQueryResult>;
declare function write(this: Connection, query: string): Promise<WriteQueryResult>;
declare function receipt(this: Connection, txnHash: string): Promise<ReceiptResult | undefined>;
declare function setController(this: Connection, tableId: string, controller: string, caller?: string): Promise<WriteQueryResult>;
export { hash, list, receipt, read, validateWriteQuery, write, setController };
