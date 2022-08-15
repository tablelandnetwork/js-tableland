import fetch from "jest-fetch-mock";

fetch.enableMocks();

declare global {
  // eslint-disable-next-line no-var, no-unused-vars
  var ethereum: any;
}

globalThis.ethereum = {
  request: function () {
    return [""];
  },
};
