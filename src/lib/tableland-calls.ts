import { getSigner, getHost, getToken } from "./single";
import { Method } from "./Method";

async function getNonce() {
  return await 0;
}

async function signTransaction(message: Object | String, gas: Number = 1000) {
  const signer = await getSigner();
  const messageWithMeta = {
    nonce: await getNonce(),
    gas: gas,
    message,
  };

  const stringToSign = JSON.stringify(messageWithMeta);

  const signedTransaction = await signer.signMessage(stringToSign);

  return {
    message: stringToSign,
    signature: signedTransaction,
  };
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
  method: Method,
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
    await GeneralizedRPC(Method.CREATE_TABLE, query, tableId)
  );
}

async function runQuery(query: string, tableId: string): Promise<string> {
  // Validation here?
  return await SendCall(await GeneralizedRPC(Method.RUN_SQL, query, tableId));
}

async function findMyTables() {
  return [];
}

export { createTable, runQuery, signTransaction, findMyTables };
