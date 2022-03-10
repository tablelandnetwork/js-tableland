import { Signer, utils, ethers } from "ethers";
import {
  ConnectionOptions,
  Connection,
  Token,
  SupportedNetwork,
} from "../interfaces.js";
import { list } from "./list.js";
import { createToken } from "./token.js";
import { query } from "./query.js";
import { create } from "./create.js";
import { hash } from "./hash.js";

declare let globalThis: any;

const SUPPORTED_NETWORKS: SupportedNetwork[] = [
  {
    key: "rinkeby",
    phrase: "Ethereum Rinkeby",
  },
];

export async function getSigner(): Promise<Signer> {
  await globalThis.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(globalThis.ethereum);
  const signer = provider.getSigner();
  return signer;
}

export async function userCreatesToken(signer: Signer): Promise<Token> {
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
  const providerNetwork = await signer.provider?.getNetwork();

  if (
    !providerNetwork?.name ||
    !SUPPORTED_NETWORKS.find((net) => net.key === providerNetwork.name)
  ) {
    const plural = SUPPORTED_NETWORKS.length > 1;
    const phrase = plural
      ? SUPPORTED_NETWORKS.map((net: any, i: number) => {
          const last = i === SUPPORTED_NETWORKS.length - 1;
          return last ? `and ${net.phrase}` : net.phrase;
        })
      : SUPPORTED_NETWORKS[0].phrase;

    throw new Error(
      `Only ${phrase} network${
        plural ? "s are" : " is"
      } currently supported. Switch your wallet connection and reconnect.`
    );
  }

  const token = options.token ?? (await userCreatesToken(signer));
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
    get list() {
      return list;
    },
    get query() {
      return query;
    },
    get create() {
      return create;
    },
    get hash() {
      return hash;
    },
  };

  return connectionObject;
}
