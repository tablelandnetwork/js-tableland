import { BigNumber, Signer } from "ethers";

export interface TableMetadata {
  controller: string;
  /* eslint-disable-next-line camelcase */
  created_at: string;
  name: string;
  structure: string;
}

export interface Token {
  token: string;
}

export interface ConnectionOptions {
  token?: Token;
  signer?: Signer;
  host?: string;
  network?: string;
  contract?: string;
}

export interface RpcParams {
  controller?: string;
  /* eslint-disable-next-line camelcase */
  create_statement?: string;
  statement?: string;
  /* eslint-disable-next-line camelcase */
  txn_hash?: string;
}

export interface SupportedNetwork {
  key: string;
  name: string; // Matches naming convention used in https://chainlist.org and ethers network lib
  phrase: string;
  chainId: number;
}

export type KeyVal<T = any> = [string, T];

export type Columns = Array<{ name: string }>;

export interface ReadQueryResult<
  Rows extends Array<string | number | boolean> = Array<any>
> {
  columns: Columns;
  rows: Rows;
}

export interface WriteQueryResult {
  hash: string;
}

export interface ReceiptResult {
  /* eslint-disable-next-line camelcase */
  chain_id: number;
  /* eslint-disable-next-line camelcase */
  txn_hash: string;
  /* eslint-disable-next-line camelcase */
  block_number: number;
  error?: string;
}

export interface StructureHashReceipt {
  structureHash: string;
}

export interface CreateTableReceipt {
  tableId?: BigNumber;
  prefix: string;
  chainId: number;
  txnHash: string;
  blockNumber: number;
}

export interface RpcReceipt<T = any> {
  jsonrpc: string;
  id: number;
  result: T;
}

export interface Connection {
  host: string;
  signer: Signer;
  token: Token;
  network: string;
  contract: string;
  list: () => Promise<TableMetadata[]>;
  create: (
    /** The schema that defines the columns and constraints of the table,
     *  e.g.
     `id int NOT NULL,
      name char(50) NOT NULL,
      favorite_food char(50),
      PRIMARY KEY (id)`
     */
    schema: string,
    /** an optional prefix to the tablename that will be assigned to this table.
     *  If supplied, it must conform to the rules of SQL table names
     **/
    prefix?: string
  ) => Promise<CreateTableReceipt>;
  read: (query: string) => Promise<ReadQueryResult>;
  write: (query: string) => Promise<WriteQueryResult>;
  hash: (query: string) => Promise<StructureHashReceipt>;
  receipt: (txnHash: string) => Promise<ReceiptResult | undefined>;
}
