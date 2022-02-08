/* eslint-disable node/no-missing-import */
import { getSigner, getHost, getToken } from "./single";

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

async function SendCall(rpcBody: Object) {
  return await fetch(`${getHost()}/rpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${(await getToken()).token}`,
    },
    body: JSON.stringify(rpcBody),
  });
}

async function GeneralizedRPC(
  method: string,
  statement: string,
  tableId: string,
  options?: any
) {
  const signer = await getSigner();
  const address = await signer.getAddress();

  const params = [
    {
      statement: statement,
      id: tableId,
      controller: address,
      type: options?.type,
    },
  ];

  return {
    jsonrpc: "2.0",
    method: `tableland_${method}`,
    id: 1,
    params,
  };
}

async function checkAuthorizedList(): Promise<boolean> {
  const authorized: boolean = await SendCall(
    await GeneralizedRPC("authorize", "", "")
  ).then((r) => {
    return r.status === 200;
  });
  return authorized;
}

export interface CreateTableOptions {
  /** A human readable description of the nature and purpoe of the table */
  description?: string;
}

export interface CreateTableReceipt {
  name: string;
  id: string;
  description?: string;
}

async function createTable(
  query: string,
  tableId: string,
  options: CreateTableOptions
): Promise<CreateTableReceipt> {
  return await SendCall(
    await GeneralizedRPC("createTable", query, tableId, options)
  ).then((r) => r.json());
}

async function runQuery(
  query: string,
  tableId: string
): Promise<ReadQueryResult> {
  return await SendCall(await GeneralizedRPC("runSQL", query, tableId)).then(
    (r) => r.json()
  );
}

import { myTables, TableMetadata } from "./myTables";
export { createTable, runQuery, myTables, checkAuthorizedList, TableMetadata };
