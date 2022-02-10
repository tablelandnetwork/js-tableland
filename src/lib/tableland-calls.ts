/* eslint-disable node/no-missing-import */

import {
  TableMetadata,
  RpcReceipt,
  CreateTableOptions,
  Connection,
} from "../interfaces";
import { myTables } from "./myTables";

async function SendCall(this: Connection, rpcBody: Object) {
  return await fetch(`${this.host}/rpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token.token}`,
    },
    body: JSON.stringify(rpcBody),
  });
}

async function GeneralizedRPC(
  this: Connection,
  method: string,
  statement: string,
  tableId: string,
  options?: any
) {
  const signer = this.signer;
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

export async function checkAuthorizedList(this: Connection): Promise<boolean> {
  const authorized: boolean = await SendCall.call(
    this,
    await GeneralizedRPC.call(this, "authorize", "", "")
  ).then((r) => {
    return r.status === 200;
  });
  return authorized;
}

export async function createTable(
  this: Connection,
  query: string,
  tableId: string,
  options: CreateTableOptions
): Promise<RpcReceipt> {
  return await SendCall.call(
    this,
    await GeneralizedRPC.call(this, "createTable", query, tableId, options)
  ).then(function (res) {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
}

async function query(
  this: Connection,
  query: string,
  tableId: string
): Promise<RpcReceipt> {
  return await SendCall.call(
    this,
    await GeneralizedRPC.call(this, "runSQL", query, tableId)
  ).then(function (res) {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
}

export { query, myTables, TableMetadata };
