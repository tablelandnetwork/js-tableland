import { SupportedNetwork } from "../interfaces.js";

declare let globalThis: any;

// From https://www.npmjs.com/package/btoa
const polyfills = {
  btoa: function (str: string) {
    const buffer = Buffer.from(str, "binary");

    return buffer.toString("base64");
  },
};

export const btoa = globalThis.btoa ?? polyfills.btoa;

export const contractAddresses: { [index: string]: string } = {
  local: "0x5fbdb2315678afecb367f032d93f642f64180aa3", // If building locally you can put your contract address here
  "optimism-kovan-staging": "0xa01C278F1Ea79D11D008b1b7DB96258dAD7621E4",
  staging: "0x847645b7dAA32eFda757d3c10f1c82BFbB7b41D0",
  testnet: "0x30867AD98A520287CCc28Cde70fCF63E3Cdb9c3C",
};

export const SUPPORTED_NETWORKS: SupportedNetwork[] = [
  {
    key: "rinkeby",
    phrase: "Ethereum Rinkeby",
    chainId: 4,
  },
  {
    key: "optimism-kovan",
    phrase: "Optimism Kovan",
    chainId: 69,
  },
  {
    key: "unknown",
    phrase: "Local Hardhat",
    chainId: 31337,
  },
];
