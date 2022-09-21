import { chainId } from "../constants";

export const ethers = {
  providers: {
    Web3Provider: function () {
      // mock provider
      return {
        send: async function () {},
        getSigner: function () {
          // mock signer
          return {
            provider: {
              getNetwork: async function () {
                return {
                  name: "maticmum",
                  chainId,
                };
              },
            },
            getAddress: function () {
              return "0x0000000000000000000000000000000000001337";
            },
            signMessage: async function () {
              return "testsignedmessage";
            },
          };
        },
      };
    },
  },
};
export const utils = {
  arrayify: function () {
    return new Uint8Array(5);
  },
  getAddress: function () {
    return "0x0000000000000000000000000000000000001337";
  },
};
export const BigNumber = {
  from: () => 1143,
};
