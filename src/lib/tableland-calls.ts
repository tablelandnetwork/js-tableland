/* eslint-disable node/no-unpublished-import */
/* eslint-disable node/no-missing-import */

import camelCase from "camelcase";
import {
  TableMetadata,
  StructureHashReceipt,
  RpcParams,
  RpcRequestParam,
  ReadQueryResult,
  KeyVal,
  CreateTableOptions,
  CreateTableReceipt,
  Connection,
} from "../interfaces.js";
import { list } from "./list.js";

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

// parse the rpc response and throw if any of the different types of errors occur
async function sendResponse(res: any) {
  if (!res.ok) throw new Error(res.statusText);

  const json = await res.json();
  // NOTE: we are leaving behind the error code because the Error type does not allow for a `code` property
  if (json.error) throw new Error(json.error.message);
  if (!json.result) throw new Error("Malformed RPC response");

  // response to reads is in `result.data` key, note: data === null for writes
  if (json.result.data) return camelCaseKeys(json.result.data);
  // response to create or hash is in `result`
  if (json.result.name || json.result.structure_hash) {
    return camelCaseKeys(json.result);
  }

  // return undefined for writes
  return undefined;
}

// Take an Object with any symantic for key naming and return a new Object with keys that are lowerCamelCase
// Example: `camelCaseKeys({structure_hash: "123"})` returns `{structureHash: "123"}`
function camelCaseKeys(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).map((entry: KeyVal) => {
      const key = entry[0];
      const val = entry[1];
      return [camelCase(key), val];
    })
  );
}

async function GeneralizedRPC(
  this: Connection,
  method: string,
  params: RpcParams = {}
) {
  const signer = this.signer;
  const address = await signer.getAddress();

  const param: RpcRequestParam = {
    controller: address,
    create_statement: params.createStatement,
    description: params.description,
    dryrun: params.dryrun,
    id: params.tableId,
    statement: params.statement,
  };

  return {
    jsonrpc: "2.0",
    method: `tableland_${method}`,
    id: 1,
    params: [param],
  };
}

export async function checkAuthorizedList(this: Connection): Promise<boolean> {
  const authorized: boolean = await SendCall.call(
    this,
    await GeneralizedRPC.call(this, "authorize")
  ).then((r) => {
    return r.status === 200;
  });
  return authorized;
}

export async function create(
  this: Connection,
  query: string,
  tableId: string,
  options: CreateTableOptions
): Promise<CreateTableReceipt> {
  const message = await GeneralizedRPC.call(this, "createTable", {
    ...options,
    tableId: tableId,
    statement: query,
  });

  const response = await SendCall.call(this, message);
  const json = await sendResponse(response);

  return json as CreateTableReceipt;
}

async function hash(
  this: Connection,
  query: string
): Promise<StructureHashReceipt> {
  const message = await GeneralizedRPC.call(this, "calculateTableHash", {
    createStatement: query,
  });

  const response = await SendCall.call(this, message);
  const json = await sendResponse(response);

  return json as StructureHashReceipt;
}

async function query(
  this: Connection,
  query: string
): Promise<ReadQueryResult | null> {
  const message = await GeneralizedRPC.call(this, "runSQL", {
    statement: query,
  });
  const response = await SendCall.call(this, message);
  const json = await sendResponse(response);

  return json as ReadQueryResult;
}

export { query, list, hash, TableMetadata };
