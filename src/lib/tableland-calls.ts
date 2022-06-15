import {
  StructureHashResult,
  ReadQueryResult,
  WriteQueryResult,
  ReceiptResult,
  Connection,
} from "./connection.js";
import { list } from "./list.js";
import { camelCaseKeys } from "./util.js";

export interface RpcParams {
  controller?: string;
  /* eslint-disable-next-line camelcase */
  create_statement?: string;
  statement?: string;
  /* eslint-disable-next-line camelcase */
  txn_hash?: string;
}

export interface RpcReceipt<T = any> {
  jsonrpc: string;
  id: number;
  result: T;
}

async function SendCall(this: Connection, rpcBody: Object, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const body = JSON.stringify(rpcBody);
  const res = await fetch(`${this.options.host}/rpc`, {
    method: "POST",
    headers,
    body,
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

async function GeneralizedRPC(
  this: Connection,
  method: string,
  params: RpcParams = {}
) {
  return {
    jsonrpc: "2.0",
    method: `tableland_${method}`,
    id: 1,
    params: [params],
  };
}

async function hash(
  this: Connection,
  query: string
): Promise<StructureHashResult> {
  const message = await GeneralizedRPC.call(this, "validateCreateTable", {
    create_statement: query,
  });
  if (!this.token) {
    await this.siwe();
  }
  const json = await SendCall.call(this, message, this.token?.token);

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
  if (!this.token) {
    await this.siwe();
  }
  const json = await SendCall.call(this, message, this.token?.token);

  return camelCaseKeys(json.result.tx);
}

async function receipt(
  this: Connection,
  txnHash: string
): Promise<ReceiptResult | undefined> {
  const message = await GeneralizedRPC.call(this, "getReceipt", {
    txn_hash: txnHash,
  });
  if (!this.token) {
    await this.siwe();
  }
  const json = await SendCall.call(this, message, this.token?.token);

  if (json.result.receipt) {
    return camelCaseKeys(json.result.receipt);
  }
  return undefined;
}

export { hash, list, receipt, read, write };
