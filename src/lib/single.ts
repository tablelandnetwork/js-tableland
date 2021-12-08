import { ethers } from "ethers";

let signer: ethers.Signer;
let host: string;

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

    return {
        ethAccounts,
        tablelandAddress
    }
}

export default connect;

export {
    getSigner,
    setSigner,
    getHost,
    setHost   
};