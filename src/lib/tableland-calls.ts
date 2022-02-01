import { getSigner, getHost, getToken } from "./single.js";

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
  }).then((r) => r.json());
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
      tableId: tableId,
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

async function createTable(query: string, tableId: string, options: any) {
  return await SendCall(
    await GeneralizedRPC("createTable", query, tableId.slice(2), options)
  );
}

async function runQuery(
  query: string,
  tableId: string
): Promise<ReadQueryResult> {
  // Validation here?
  return await SendCall(await GeneralizedRPC("runSQL", query, tableId));
}

export interface TableMetadata {
  id: string;
  type: string;
}

async function myTables(): Promise<TableMetadata[]> {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const host = await getHost();
  const resp: TableMetadata[] = await fetch(
    `${host}/tables/controller/${address}`
  ).then((r) => r.json());

  return resp;
}

export { createTable, runQuery, myTables, checkAuthorizedList };
