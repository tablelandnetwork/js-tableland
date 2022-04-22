import { SupportedNetwork } from "../interfaces.js";

declare let globalThis: any;

// From https://www.npmjs.com/package/btoa
const polyfills = {
  btoa: function (str: string) {
    const buffer = Buffer.from(str.toString(), "binary");

    return buffer.toString("base64");
  },
};

export const btoa = globalThis.btoa ?? polyfills.btoa;

export const contractAddresses: { [index: string]: string } = {
  local: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  staging: "0x847645b7dAA32eFda757d3c10f1c82BFbB7b41D0",
  testnet: "0x30867AD98A520287CCc28Cde70fCF63E3Cdb9c3C",
};

export const SUPPORTED_NETWORKS: SupportedNetwork[] = [
  {
    key: "rinkeby",
    phrase: "Ethereum Rinkeby",
    chainId: 4,
  },
];
