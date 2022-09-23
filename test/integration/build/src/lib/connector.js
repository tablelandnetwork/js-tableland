import { list } from "./list.js";
import { read, write } from "./query.js";
import { create } from "./create.js";
import { hash } from "./hash.js";
import { siwe } from "./siwe.js";
import { receipt, validateWriteQuery } from "./tableland-calls.js";
import { setController } from "./set-controller.js";
import { getController } from "./get-controller.js";
import { lockController } from "./lock-controller.js";
import { schema } from "./schema.js";
import { structure } from "./structure.js";
import { SUPPORTED_CHAINS, waitConfirm, } from "./util.js";
/**
 * Create client connection with Tableland, EVM, and Gateway.
 * @param options Options to control client connection.
 * @returns Promise that resolves to a Connection object.
 */
export function connect(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const network = (_a = options.network) !== null && _a !== void 0 ? _a : "testnet";
    const chain = (_b = options.chain) !== null && _b !== void 0 ? _b : "polygon-mumbai";
    if (network === "custom" && !options.host) {
        throw new Error('`host` must be provided if using "custom" network');
    }
    if (!["testnet", "staging", "custom"].includes(network)) {
        throw new Error("unsupported network specified");
    }
    const signer = options.signer;
    const info = SUPPORTED_CHAINS[chain];
    if (!info && !options.chainId) {
        throw new Error("unsupported chain information. See `SUPPORTED_CHAINS` for options");
    }
    const host = (_c = options.host) !== null && _c !== void 0 ? _c : info.host;
    const chainId = (_d = options.chainId) !== null && _d !== void 0 ? _d : info.chainId;
    // We can override the contract address here for any supported network
    const contract = (_e = options.contract) !== null && _e !== void 0 ? _e : info.contract;
    // Enable specifying rpcRelay, otherwise use the SUPPORTED_CHAINS value
    const rpcRelay = typeof options.rpcRelay === "boolean" ? options.rpcRelay : info.rpcRelay;
    // If a token was provided, we cache it
    const token = options.token;
    const siweUri = (_h = (_f = options.siweUri) !== null && _f !== void 0 ? _f : (_g = globalThis.document) === null || _g === void 0 ? void 0 : _g.location.origin) !== null && _h !== void 0 ? _h : "https://tableland.xyz";
    const connectionObject = {
        token,
        signer,
        options: {
            rpcRelay,
            network,
            host,
            chain,
            chainId,
            contract,
            siweUri,
        },
        get list() {
            return list;
        },
        get read() {
            return read;
        },
        get write() {
            return write;
        },
        get create() {
            return create;
        },
        get hash() {
            return hash;
        },
        get receipt() {
            return receipt;
        },
        get siwe() {
            return siwe;
        },
        get setController() {
            return setController;
        },
        get getController() {
            return getController;
        },
        get lockController() {
            return lockController;
        },
        get validate() {
            return validateWriteQuery;
        },
        get waitConfirm() {
            return waitConfirm;
        },
        get schema() {
            return schema;
        },
        get structure() {
            return structure;
        },
    };
    return connectionObject;
}
//# sourceMappingURL=connector.js.map