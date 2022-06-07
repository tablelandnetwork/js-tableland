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
  // If building locally you can put your contract address here or use the contract connection option
  local: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",

  goerli: "0xa4b0729f02C6dB01ADe92d247b7425953d1DbA25",
  görli: "0xa4b0729f02C6dB01ADe92d247b7425953d1DbA25", // support umlaut
  testnet: "0xa4b0729f02C6dB01ADe92d247b7425953d1DbA25", // Görli is used for "testnet"

  "optimism-kovan-staging": "0x322F01e81c38B4211529f334864fA630F6aeA408",
  staging: "0x322F01e81c38B4211529f334864fA630F6aeA408", // Optimism Kovan is used for "staging"

  "optimism-kovan": "0xf9C3530C03D335a00163382366a72cc1Ebbd39fF",
  "polygon-mumbai": "0x70364D26743851d4FE43eCb065811402D06bf4AD",
};

export const SUPPORTED_NETWORKS: SupportedNetwork[] = [
  {
    key: "goerli",
    phrase: "Ethereum Goerli",
    chainId: 5,
  },
  {
    key: "optimism-kovan",
    phrase: "Optimism Kovan",
    chainId: 69,
  },
  {
    key: "polygon-mumbai",
    phrase: "Polygon Testnet",
    chainId: 80001,
  },
  {
    key: "unknown",
    phrase: "Local Hardhat",
    chainId: 31337,
  },
];
