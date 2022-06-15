import fetch from "jest-fetch-mock";

fetch.enableMocks();

// jest.mock("./lib/single", () => {
//   return {
//     getHost: async () => "",
//     getSigner: async () => ({getAddress:async ()=>""})
//   }
// });

declare global {
  var ethereum: any;
}

globalThis.ethereum = {
  request: function () {
    return [""];
  },
};
