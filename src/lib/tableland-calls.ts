/* eslint-disable node/no-missing-import */

import camelCase from "camelcase";
import {
  TableMetadata,
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

  return json.result;
}

// Take an Object with any symantic for key naming and return a new Object with keys that are lowerCamelCase
// Example: `camelCaseKeys({structure_hash: "123"})` returns `{structureHash: "123"}`
function camelCaseKeys(obj: object) {
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
  statement: string,
  tableId?: string,
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
      dryrun: options?.dryrun,
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

export async function create(
  this: Connection,
  query: string,
  tableId: string,
  options: CreateTableOptions
): Promise<CreateTableReceipt> {
  const message = await GeneralizedRPC.call(
    this,
    "createTable",
    query,
    tableId,
    options
  );
  const response = await SendCall.call(this, message);
  const json = await sendResponse(response);

  return camelCaseKeys(json) as CreateTableReceipt;
}

async function query(
  this: Connection,
  query: string
): Promise<ReadQueryResult | null> {
  const message = await GeneralizedRPC.call(this, "runSQL", query);
  const response = await SendCall.call(this, message);
  const json = await sendResponse(response);

  return camelCaseKeys(json) as ReadQueryResult;
}

export { query, list, TableMetadata };
