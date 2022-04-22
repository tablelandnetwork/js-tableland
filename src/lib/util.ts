declare let globalThis: any;

// From https://www.npmjs.com/package/btoa
const polyfills = {
  btoa: function (str: string | Buffer) {
    let buffer;

    if (str instanceof Buffer) {
      buffer = str;
    } else {
      buffer = Buffer.from(str.toString(), "binary");
    }

    return buffer.toString("base64");
  },
};

export const btoa = globalThis.btoa ?? polyfills.btoa;
