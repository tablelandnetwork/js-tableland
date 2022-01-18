import { getSigner, getHost, getToken } from "./single.js";

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
  tableId: string
) {
  const signer = await getSigner();
  const address = await signer.getAddress();
  return {
    jsonrpc: "2.0",
    method: `tableland_${method}`,
    id: 1,
    params: [
      {
        statement: statement,
        tableId: tableId,
        controller: address,
      },
    ],
  };
}

async function createTable(query: string, tableId: string) {
  return await SendCall(
    await GeneralizedRPC("createTable", query, tableId.slice(2))
  );
}

async function runQuery(query: string, tableId: string): Promise<object> {
  // Validation here?
  return await SendCall(await GeneralizedRPC("runSQL", query, tableId));
}

async function myTables() {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const host = await getHost();
  const resp = await fetch(`${host}/tables/controller/${address}`).then((r) =>
    r.json()
  );
  return resp;
}

export { createTable, runQuery, myTables };
