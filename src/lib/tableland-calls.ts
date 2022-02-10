/* eslint-disable node/no-missing-import */
import { getSigner, getHost, getToken } from "./single";

import { TableMetadata, RpcReceipt, CreateTableOptions } from "../interfaces";
import { myTables } from "./myTables";

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

async function createTable(
  query: string,
  tableId: string,
  options: CreateTableOptions
): Promise<RpcReceipt> {
  return await SendCall(
    await GeneralizedRPC("createTable", query, tableId, options)
  ).then(function (res) {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
}

async function query(query: string, tableId: string): Promise<RpcReceipt> {
  return await SendCall(await GeneralizedRPC("runSQL", query, tableId)).then(
    function (res) {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    }
  );
}

export { createTable, query, myTables, checkAuthorizedList, TableMetadata };
