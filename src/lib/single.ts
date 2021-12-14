import { ethers, utils } from "ethers";
import { createToken, Signer } from "@textile/core-storage";

let signer: Signer;
let host: string;
let token: any;
let connected: boolean;

function isConnected() {
  return connected;
}

function connectionCheck() {
  if (!isConnected()) {
    throw Error("Please connect your account before trying anything.");
  }
}

async function setToken(tokenToBe?: string) {
  const ethAccounts = await globalThis.ethereum.request({
    method: "eth_requestAccounts",
  });

  const signer = await getSigner();

  const sign = {
    signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
      const sig = await signer.signMessage(message);
      return utils.arrayify(sig);
    },
  };
  const iat = ~~(Date.now() / 1000);
  const exp = iat + 60 * 60 * 10; // Default to ~10 hours

  token =
    tokenToBe ||
    (await createToken(sign, {}, { iss: ethAccounts[0], exp: exp }));
}

async function getToken(): Promise<Object> {
  if (!token) {
    await setToken();
  }
  return token;
}

async function setSigner(newSigner: Signer) {
  signer = newSigner;
  return true;
}

async function getSigner(): Promise<Signer> {
  if (!signer) {
    const provider = new ethers.providers.Web3Provider(globalThis.ethereum);
    signer = provider.getSigner();

    return signer;
  }
  return signer;
}

function getHost(): string {
  if (!host) {
    throw Error("No host set");
  }

  return host;
}

async function setHost(newHost: string) {
  // Should probably validate newHost is a valid host.
  host = newHost;
}

async function connect(validatorHost: string, options: Object = {}) {
  if (!validatorHost) {
    throw Error(
      `You haven't specified a tableland validator. If you don't have your own, try gateway.tableland.com.`
    );
  }

  setHost(validatorHost);

  // @ts-ignore
  const ethAccounts = await globalThis.ethereum.request({
    method: "eth_requestAccounts",
  });
  const tablelandAddress = {};

  if (options.jwsToken) {
    await setToken(options.jwsToken);
  }
  // @ts-ignore
  const jwsToken = await getToken();
  connected = true;
  return {
    jwsToken,
    ethAccounts,
    tablelandAddress,
  };
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
  connectionCheck,
};
