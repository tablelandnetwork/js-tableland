import { getSigner, getHost } from "./single";
import { ContractReceipt } from "@ethersproject/contracts";

enum Method {
    CREATE_TABLE = "createTable",
    RUN_SQL = "runSQL"
}

async function getNonce() {
    return await 0;
}

async function signTransaction(message:Object|String, gas:Number=1000) {

    // Ignoreing because 
    // @ts-ignore

    let signer = await getSigner();
    let messageWithMeta = {
        nonce: await getNonce(),
        gas: gas,
        message
    };

    let stringToSign = JSON.stringify(messageWithMeta)

    let signedTransaction = await signer.signMessage(stringToSign);
    

    return {
        message: stringToSign,
        signature: signedTransaction
    };  
}

async function SendCall(rpcBody: Object) {
    return await fetch(`${getHost()}/rpc`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(rpcBody)
    }).then(r=>r.json());
    

}

async function GeneralizedRPC(method: Method, statement: string) {


    let transaction = await signTransaction(statement);

    return {
        "jsonrpc": "2.0", 
        "method": `tableland_${method}`, 
        "id" : 1,
        "params": [{
            "statement": statement,
            "transaction": transaction
        }]
    };
}

async function createTable(query: string, registryTxn: ContractReceipt) {
    
    return await SendCall(await GeneralizedRPC(Method.CREATE_TABLE, query));
}

async function runQuery(query: string) : Promise<string> {





    // Validation here? 
    return await SendCall(await GeneralizedRPC(Method.RUN_SQL, query));

}

export {
    createTable,
    runQuery
}
