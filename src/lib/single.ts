import { ethers } from "ethers";
import { createToken, Signer } from '@textile/core-storage';



let signer: ethers.Signer;
let host: string;
let token : Object;
let connected: boolean;

function isConnected() {
    return connected;
}

function connectionCheck() {
    if(!isConnected()) {
        throw("Please connect your account before trying anything.")
    }
}

async function setToken(token_to_be?: string) {
    // @ts-ignore
    let ethAccounts = await globalThis.ethereum.request({method:'eth_requestAccounts'});

    // @ts-ignore
    token = token_to_be || await createToken(await getSigner(), {}, {iss: ethAccounts[0] });

}

async function getToken(): Promise<Object> {
    if(!token) {
        await setToken();
    }
    return token;
}

async function setSigner(newSigner: ethers.Signer) {
    signer = newSigner;
    return true; 
}

async function getSigner(): Promise<ethers.Signer> {
    if(!signer) {
        
        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(globalThis.ethereum);
        signer = provider.getSigner();

        return signer;
    }
    return signer;
}

function getHost(): string {
    if(!host) {
        throw ("No host set");
    }

    return host;
}

async function setHost(newHost: string) {
    // Should probably validate newHost is a valid host.
    host = newHost;
}

async function connect(validatorHost: string, options?: Object|undefined) {
    
    if(!validatorHost) {
        throw (`You haven't specified a tableland validator. If you don't have your own, try gateway.tableland.com.`);
    }

    setHost(validatorHost);

    // @ts-ignore
    let ethAccounts = await globalThis.ethereum.request({method:'eth_requestAccounts'});
    let tablelandAddress = {};
    // @ts-ignore
    const jws_token = options?.token || await getToken();
    connected = true;
    return {
        jws_token,
        ethAccounts,
        tablelandAddress,
    }
}

export default connect;

export {
    getSigner,
    setSigner,
    getHost,
    setHost,
    setToken,
    getToken,
    isConnected,
    connectionCheck
};