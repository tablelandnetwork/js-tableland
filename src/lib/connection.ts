import { BigNumber, Signer } from "ethers";
import { Token } from "./token.js";
import { ChainName, NetworkName } from "./util.js";

export interface TableMetadata {
  controller: string;
  createdAt: string;
  name: string;
  structure: string;
}

export type Columns = Array<{ name: string }>;
export type SchemaColumns = Array<{
  name: string;
  type?: string;
  constraints?: string[];
}>;

export type Rows = Array<string | number | boolean>;

export interface ReadQueryResult<R extends Rows = Array<any>> {
  columns: Columns;
  rows: R;
}

export interface WriteQueryResult {
  hash: string;
}

export interface ReceiptResult {
  chainId: number;
  txnHash: string;
  blockNumber: number;
  error?: string;
}

export interface StructureHashResult {
  structureHash: string;
}

export interface ValidateWriteResult {
  tableId: number;
}

export interface CreateTableReceipt {
  tableId?: BigNumber;
  name?: string;
  prefix?: string;
  chainId: number;
  txnHash: string;
  blockNumber: number;
}

export interface SchemaQueryResult {
  columns: SchemaColumns;
  /* eslint-disable-next-line camelcase */
  table_constraints: string[];
}

export interface StructureQueryResult {
  controller: string;
  name: string;
  structure: string;
}

export interface CreateOptions {
  prefix?: string;
  skipConfirm?: boolean;
  timeout?: number;
}

export interface WriteOptions {
  skipConfirm?: boolean;
  rpcRelay?: boolean;
}

export interface SetControllerOptions {
  rpcRelay?: boolean;
}

export interface HashOptions {
  prefix?: string;
}

export interface ConfirmOptions {
  timeout?: number;
  rate?: number;
}

export type PrefixOptions = HashOptions | CreateOptions;
export type RelayOptions = WriteOptions | SetControllerOptions;
export type SkipConfirmOptions = WriteOptions | CreateOptions;
export type TimeoutOptions = ConfirmOptions | CreateOptions;

export interface Connection {
  token?: Token;
  signer?: Signer;
  options: {
    host: string;
    network: NetworkName;
    chain?: ChainName;
    contract: string;
    chainId: number;
    rpcRelay: boolean;
  };
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
    /**
     *  an optional options argument to specify conditions of create.
     **/
    options?: CreateOptions
  ) => Promise<CreateTableReceipt>;
  read: (query: string) => Promise<ReadQueryResult>;
  write: (query: string, options?: WriteOptions) => Promise<WriteQueryResult>;
  hash: (schema: string, options?: HashOptions) => Promise<StructureHashResult>;
  receipt: (txnHash: string) => Promise<ReceiptResult | undefined>;
  setController: (
    controller: string,
    name: string,
    options?: SetControllerOptions
  ) => Promise<WriteQueryResult>;
  getController: (tableName: string) => Promise<string>;
  lockController: (tableName: string) => Promise<WriteQueryResult>;
  siwe: () => Promise<Token>;
  validate: (query: string) => Promise<ValidateWriteResult>;
  waitConfirm: (
    txnHash: string,
    options?: ConfirmOptions
  ) => Promise<ReceiptResult>;
  schema: (tableName: string) => Promise<SchemaQueryResult>;
  structure: (tableName: string) => Promise<StructureQueryResult[]>;
}
