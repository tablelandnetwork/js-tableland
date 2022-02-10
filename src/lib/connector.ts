import { Signer, utils, ethers } from "ethers";
import { ConnectionOptions, Connection, Token } from "../interfaces";
import { myTables } from "./myTables";
import { createToken } from "./token";
import { query } from "./query";
import { create } from "./create";

declare let globalThis: any;
async function getSigner(): Promise<Signer> {
  const provider = new ethers.providers.Web3Provider(globalThis.ethereum);
  const signer = provider.getSigner();
  return signer;
}

async function userCreatesToken(signer: Signer): Promise<Token> {
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

  return await createToken(
    sign,
    { kid: kid, alg: "ETH" },
    { iss: iss, exp: exp }
  );
}

export async function connect(options: ConnectionOptions): Promise<Connection> {
  const network = options.network ?? "testnet";
  const host = options.host ?? "https://testnet.tableland.network";

  if (network !== "testnet" && !options.host) {
    throw Error(
      "Please specify a host to connect to. (Example: https://env.tableland.network)"
    );
  }

  const signer = options.signer ?? (await getSigner());
  const token = await userCreatesToken(signer);
  const connectionObject: Connection = {
    get token() {
      return token;
    },
    get network() {
      return network;
    },
    get host() {
      return host;
    },
    get signer() {
      return signer;
    },
    get myTables() {
      return myTables;
    },
    get query() {
      return query;
    },
    get create() {
      return create;
    },
  };

  return connectionObject;
}
