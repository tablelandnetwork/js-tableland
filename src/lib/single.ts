import { ethers, utils, Signer } from "ethers";
import { createToken } from "@textile/core-storage";

let signer: Signer;
let host: string;
let token: any;
let connected: boolean;

declare global {
  // eslint-disable-next-line no-var
  var ethereum: any;
}

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

  // WARN: This is a non-standard JWT
  // Borrows ideas from: https://github.com/ethereum/EIPs/issues/1341
  const iss = await signer.getAddress();
  const network = await signer.provider?.getNetwork();
  const chain = network?.chainId ?? "unknown";
  let net = network?.name;
  if (net?.startsWith("matic")) net = "poly";
  else net = "eth";
  const kid = `${net}:${chain}:${iss}`;

  token = tokenToBe ? {token: tokenToBe} : (await createToken(sign, {kid: kid, alg: 'ETH'}, { iss: ethAccounts[0], exp: exp }));
}

interface Token {
  token: string;
}

async function getToken(): Promise<Token> {
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

interface Authenticator {
  jwsToken: string;
}

async function connect(
  validatorHost: string,
  options: Authenticator = { jwsToken: "" }
) {
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
