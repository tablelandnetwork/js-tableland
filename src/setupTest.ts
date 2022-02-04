import fetch from "jest-fetch-mock";

fetch.enableMocks();

jest.mock("./lib/single", () => {
  return {
    getHost: async () => "",
    getSigner: async () => ({getAddress:async ()=>""})
  }
});

jest.mock("ethers", function () {
  return {
    providers: {
      Web3Provider: function () {
        // mock provider
        return {
          send: async function () {},
          getSigner: function () {
            // mock signer
            return {
              getAddress: function () {
                return "testaddress";
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
});
