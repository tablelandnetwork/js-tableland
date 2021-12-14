import { ethers, utils } from "ethers";
import { createToken, Signer } from '@textile/core-storage';



let signer: Signer;
let host: string;
let token : any;
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

         const ethAccounts = await globalThis.ethereum.request({method:'eth_requestAccounts'});  


    const signer = await getSigner();

    const sign = {
        signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
          const sig = await signer.signMessage(message);
          return utils.arrayify(sig);
        },
      };
    token = token_to_be || await createToken(sign, {}, {iss: ethAccounts[0],  });

}

async function getToken(): Promise<Object> {
    if(!token) {
        await setToken();
    }
    return token;
}

async function setSigner(newSigner: Signer) {
    signer = newSigner;
    return true; 
}

async function getSigner(): Promise<Signer> {
    if(!signer) {
        

        const provider = new ethers.providers.Web3Provider(globalThis.ethereum);
        signer = provider.getSigner();

        return signer;
    }
    return signer;
  }
  return signer;
}

function getHost(): string {
  if (!host) {
    throw "No host set";
  }

  return host;
}

async function setHost(newHost: string) {
  // Should probably validate newHost is a valid host.
  host = newHost;
}

async function connect(validatorHost: string, options: Object={}) {
    
    if(!validatorHost) {
        throw (`You haven't specified a tableland validator. If you don't have your own, try gateway.tableland.com.`);
    }

    setHost(validatorHost);

    // @ts-ignore
    const ethAccounts = await globalThis.ethereum.request({method:'eth_requestAccounts'});
    const tablelandAddress = {};
    
    if(options.jws_token) {
        await setToken(options.jws_token);
    }
    // @ts-ignore
    const jws_token = await getToken();
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
