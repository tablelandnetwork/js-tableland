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

export interface CreateTableReceipt {
  tableId?: BigNumber;
  name?: string;
  prefix?: string;
  chainId: number;
  txnHash: string;
  blockNumber: number;
}

export interface Connection {
  token?: Token;
  signer?: Signer;
  options: {
    host: string;
    network: NetworkName;
    chain?: ChainName;
    contract: string;
    chainId: number;
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
    /** an optional prefix to the tablename that will be assigned to this table.
     *  If supplied, it must conform to the rules of SQL table names
     **/
    prefix?: string
  ) => Promise<CreateTableReceipt>;
  read: (query: string) => Promise<ReadQueryResult>;
  write: (query: string) => Promise<WriteQueryResult>;
  hash: (query: string) => Promise<StructureHashResult>;
  receipt: (txnHash: string) => Promise<ReceiptResult | undefined>;
  siwe: () => Promise<Token>;
}
