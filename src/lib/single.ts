import { ethers, utils, Signer } from "ethers";
import { createToken } from "./token";

export interface Token {
  token: string;
}

let signer: Signer;
let host: string;
let token: Token;
let connected: boolean;

declare let globalThis: any;

function isConnected() {
  return connected;
}

function connectionCheck() {
  if (!isConnected()) {
    throw Error("Please connect your account before trying anything.");
  }
}

async function setToken(tokenToBe?: Token) {
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

  token =
    tokenToBe ||
    (await createToken(sign, { kid: kid, alg: "ETH" }, { iss: iss, exp: exp }));
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

export interface Authenticator {
  jwsToken: Token;
  validatorHost: string;
}

export interface ConnectionDetails {
  jwsToken: Token;
  ethAccounts: Array<string>;
}

/**
 *
 * `connect` is a wrapper for using an ethereum signature to communicate with a Tableland server.
 * This client library can be used to interact with a local or remote Tableland gRPC-service
 * It is a wrapper around Textile Tableland DB API
 *
 * @param {Authenticator} Object Host to connect to, and previous jwsToken if needed.
 * @returns {ConnectionDetails} Object containing JWS token, and a list of ETH accounts
 *
 * @example
 * ```typescript
 * import { connect, createTable } from '@textile/tableland'
 *
 *
 * async function setupDB() {
 *    const connectionDetails = await connect("https://testnet.tableland.network");
 *    createTable("CREATE TABLE table_name (Foo varchar(255), Bar int)");
 * }
 * ```
 */
async function connect(
  options: Authenticator = {
    validatorHost: "https://testnet.tableland.network",
    jwsToken: { token: "" },
  }
): Promise<ConnectionDetails> {
  let { validatorHost, jwsToken } = options;
  if (!validatorHost) {
    throw Error(
      `You haven't specified a tableland validator. If you don't have your own, try https://testnet.tableland.network.`
    );
  }

  setHost(validatorHost);

  const ethAccounts = await globalThis.ethereum.request({
    method: "eth_requestAccounts",
  });

  if (options.jwsToken) {
    await setToken(options.jwsToken);
  }

  jwsToken = await getToken();
  connected = true;
  return {
    jwsToken,
    ethAccounts,
  };
}

export {
  connect,
  getSigner,
  setSigner,
  getHost,
  setHost,
  setToken,
  getToken,
  isConnected,
  connectionCheck,
};
