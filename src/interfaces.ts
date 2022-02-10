import { BigNumber, ContractReceipt, Signer } from "ethers";

export interface TableMetadata {
  id: string;
  /* eslint-disable-next-line camelcase */
  created_at?: string;
  description?: string;
  tablename?: string;
  name?: string;
  controller?: string;
  structure?: string;
}

export interface Token {
  token: string;
}

export interface ConnectionOptions {
  jwsToken?: Token;
  signer?: Signer;
  host: string;
  network?: string;
}

export interface ConnectionReceipt {
  jwsToken: Token;
  ethAccounts: Array<string>;
}

/**
 * ColumnDescriptor gives metadata about a colum (name, type)
 */
export interface ColumnDescriptor {
  name: string;
}

export interface Column extends Array<any> {
  [index: number]: ColumnDescriptor;
}

export interface Row extends Array<any> {
  [index: number]: string | number;
}

export interface ReadQueryResult {
  columns: Array<Column>;
  rows: Array<Row>;
}

export interface CreateTableOptions {
  /** A human readable description of the nature and purpoe of the table */
  description?: string;
  /** If your table was minted, but never created on tableland, use this param to create it. */
  id?: string;
}

export interface CreateTableReceipt {
  name: string;
  id: string;
  description?: string;
}

export interface TableRegistrationReceipt {
  receipt: ContractReceipt;
  tableId: BigNumber;
}

export interface RpcReceipt {
  jsonrpc: string;
  id: number;
  result: any;
}

export interface Connection {
  host: string;
  signer: Signer;
  token: Token;
  network: string;
  myTables: () => Promise<TableMetadata[]>;
  create: (
    query: string,
    options: { description: string }
  ) => Promise<CreateTableReceipt>;
  query: (query: string) => Promise<null | ReadQueryResult>;
}
