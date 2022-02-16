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
                return { name: "rinkeby" };
              }
            },
            getAddress: function () {
              return "testaddress";
            },
            signMessage: async function () {
              return "testsignedmessage";
            }
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
};
export const BigNumber = {
  from: () => 1143,
};
