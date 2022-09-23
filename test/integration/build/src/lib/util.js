var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
import { ethers } from "ethers";
import BufferPolyfil from "buffer";
import camelCase from "camelcase";
import * as evm from "@tableland/evm/proxies.js";
export function getSigner() {
    return __awaiter(this, void 0, void 0, function* () {
        yield globalThis.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(globalThis.ethereum);
        const signer = provider.getSigner();
        return signer;
    });
}
// From https://www.npmjs.com/package/btoa
const polyfills = {
    btoa: function (str) {
        const buffer = Buffer.from(str, "binary");
        return buffer.toString("base64");
    },
    Buffer: BufferPolyfil,
};
export const btoa = (_a = globalThis.btoa) !== null && _a !== void 0 ? _a : polyfills.btoa;
export const Buffer = (_b = globalThis.Buffer) !== null && _b !== void 0 ? _b : polyfills.Buffer;
export const SUPPORTED_CHAINS = {
    // Testnet
    "ethereum-goerli": {
        name: "goerli",
        phrase: "Ethereum Goerli",
        chainId: 5,
        contract: evm.proxies["ethereum-goerli"],
        host: "https://testnet.tableland.network",
        rpcRelay: true,
    },
    ethereum: {
        name: "ethereum",
        phrase: "Ethereum Mainnet",
        chainId: 1,
        contract: evm.proxies.ethereum,
        host: "https://testnet.tableland.network",
        rpcRelay: false,
    },
    "optimism-kovan": {
        name: "optimism-kovan",
        phrase: "Optimism Kovan",
        chainId: 69,
        contract: evm.proxies["optimism-kovan"],
        host: "https://testnet.tableland.network",
        rpcRelay: true,
    },
    "optimism-goerli": {
        name: "optimism-goerli",
        phrase: "Optimism Goerli",
        chainId: 420,
        contract: evm.proxies["optimism-goerli"],
        host: "https://testnet.tableland.network",
        rpcRelay: true,
    },
    optimism: {
        name: "optimism",
        phrase: "Optimism Mainnet",
        chainId: 10,
        contract: evm.proxies.optimism,
        host: "https://testnet.tableland.network",
        rpcRelay: false,
    },
    "arbitrum-goerli": {
        name: "arbitrum-goerli",
        phrase: "Arbitrum Goerli",
        chainId: 421613,
        contract: evm.proxies["arbitrum-goerli"],
        host: "https://testnet.tableland.network",
        rpcRelay: true,
    },
    "polygon-mumbai": {
        name: "maticmum",
        phrase: "Polygon Mumbai",
        chainId: 80001,
        contract: evm.proxies["polygon-mumbai"],
        host: "https://testnet.tableland.network",
        rpcRelay: true,
    },
    polygon: {
        name: "matic",
        phrase: "Polygon Mainnet",
        chainId: 137,
        contract: evm.proxies.polygon,
        host: "https://testnet.tableland.network",
        rpcRelay: false,
    },
    // staging
    "optimism-kovan-staging": {
        name: "optimism-kovan",
        phrase: "Optimism Kovan",
        chainId: 69,
        contract: evm.proxies["optimism-kovan-staging"],
        host: "https://staging.tableland.network",
        rpcRelay: true,
    },
    "optimism-goerli-staging": {
        name: "optimism-goerli",
        phrase: "Optimism Goerli",
        chainId: 420,
        contract: evm.proxies["optimism-goerli-staging"],
        host: "https://staging.tableland.network",
        rpcRelay: true,
    },
    "local-tableland": {
        name: "localhost",
        phrase: "Local Tableland",
        chainId: 31337,
        contract: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        host: "http://localhost:8080",
        rpcRelay: true,
    },
    // Testing
    custom: {
        name: "localhost",
        phrase: "Custom Chain",
        chainId: 31337,
        // If building locally you can put your contract address and host here or use the contract connection option
        contract: "",
        host: "",
        rpcRelay: true,
    },
};
// Take an Object with any symantic for key naming and return a new Object with keys that are lowerCamelCase
// Example: `camelCaseKeys({structure_hash: "123"})` returns `{structureHash: "123"}`
export function camelCaseKeys(obj) {
    return Object.fromEntries(Object.entries(obj).map((entry) => {
        const key = entry[0];
        const val = entry[1];
        return [camelCase(key), val];
    }));
}
// Helper function to enable waiting until a transaction has been materialized by the Validator.
// Uses simple polling with exponential backoff up to a maximum timeout.
// Potential optimization could be had if the Validator supports subscribing to transaction
// receipts via Websockets or long-poling in the future
export function waitConfirm(txnHash, options) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // default timeout 2 minutes
        const timeout = getTimeout(options);
        // determines how often to check for materialization before timeout
        const rate = (_a = options === null || options === void 0 ? void 0 : options.rate) !== null && _a !== void 0 ? _a : 1500;
        const start = Date.now();
        // next tick then try immediately
        yield new Promise((resolve) => setTimeout(resolve, 0));
        let table = yield this.receipt(txnHash);
        let tries = 0;
        while (!table && start + timeout > Date.now()) {
            // increase the time between each call, but never go past the specified timeout
            const waitForMs = rate * Math.pow(2, tries);
            const nextTry = start + timeout < Date.now() + waitForMs
                ? start + timeout - Date.now()
                : waitForMs;
            yield new Promise((resolve) => setTimeout(resolve, nextTry));
            table = yield this.receipt(txnHash);
            tries++;
        }
        // Throw and let the caller decide what to do if the timeout is exceeded
        if (!table) {
            throw new Error(`timeout exceeded: could not get transaction receipt: ${txnHash}`);
        }
        return table;
    });
}
export function getPrefix(options) {
    if (typeof options === "undefined")
        return "";
    return options.prefix || "";
}
export function shouldSkipConfirm(options) {
    if (typeof options === "undefined")
        return false;
    return !!options.skipConfirm;
}
export function shouldRelay(connection, options) {
    if (typeof options === "undefined")
        return connection.options.rpcRelay;
    if (typeof options.rpcRelay === "boolean") {
        return options.rpcRelay;
    }
    return connection.options.rpcRelay;
}
export const defaultTimeout = 120 * 1000; // 2 mintues
export function getTimeout(options) {
    if (typeof options === "undefined")
        return defaultTimeout;
    if (typeof options.timeout !== "number")
        return defaultTimeout;
    return options.timeout;
}
//# sourceMappingURL=util.js.map