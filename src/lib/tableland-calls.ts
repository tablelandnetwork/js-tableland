/* eslint-disable node/no-missing-import */
import camelCase from "camelcase";
import {
  StructureHashReceipt,
  RpcParams,
  ReadQueryResult,
  WriteQueryResult,
  ReceiptResult,
  KeyVal,
  Connection,
} from "../interfaces.js";
import { list } from "./list.js";

async function SendCall(this: Connection, rpcBody: Object) {
  const res = await fetch(`${this.host}/rpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token.token}`,
    },
    body: JSON.stringify(rpcBody),
  });

  return parseResponse(res);
}

// parse the rpc response and throw if any of the different types of errors occur
async function parseResponse(res: any): Promise<any> {
  if (!res.ok) throw new Error(res.statusText);

  const json = await res.json();
  // NOTE: we are leaving behind the error code because the Error type does not allow for a `code` property
  if (json.error) throw new Error(json.error.message);
  if (!json.result) throw new Error("Malformed RPC response");

  return json;
}

// Take an Object with any symantic for key naming and return a new Object with keys that are lowerCamelCase
// Example: `camelCaseKeys({structure_hash: "123"})` returns `{structureHash: "123"}`
function camelCaseKeys(obj: any): any {
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

  const param: RpcParams = { controller: address, ...params };

  return {
    jsonrpc: "2.0",
    method: `tableland_${method}`,
    id: 1,
    params: [param],
  };
}

async function hash(
  this: Connection,
  query: string
): Promise<StructureHashReceipt> {
  const message = await GeneralizedRPC.call(this, "validateCreateTable", {
    create_statement: query,
  });
  const json = await SendCall.call(this, message);

  return camelCaseKeys(json.result);
}

async function read(this: Connection, query: string): Promise<ReadQueryResult> {
  const message = await GeneralizedRPC.call(this, "runReadQuery", {
    statement: query,
  });
  const json = await SendCall.call(this, message);

  return camelCaseKeys(json.result.data);
}

// Note: This method returns right away, once the write request has been sent to a validator for
//       writing to the Tableland smart contract. However, the write is not confirmed until a validator
//       has picked up the write event from the smart contract, and digested the event locally.
async function write(
  this: Connection,
  query: string
): Promise<WriteQueryResult> {
  const message = await GeneralizedRPC.call(this, "relayWriteQuery", {
    statement: query,
  });
  const json = await SendCall.call(this, message);

  return camelCaseKeys(json.result.tx);
}

async function receipt(
  this: Connection,
  txnHash: string
): Promise<ReceiptResult | undefined> {
  const message = await GeneralizedRPC.call(this, "getReceipt", {
    txn_hash: txnHash,
  });
  const json = await SendCall.call(this, message);

  if (json.result.receipt) return camelCaseKeys(json.result.receipt);
  // if the transaction hasn't been digested return undefined
  return undefined;
}

export { hash, list, receipt, read, write };
