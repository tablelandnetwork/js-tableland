var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { list } from "./list.js";
import { camelCaseKeys } from "./util.js";
function SendCall(rpcBody, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        const body = JSON.stringify(rpcBody);
        const res = yield fetch(`${this.options.host}/rpc`, {
            method: "POST",
            headers,
            body,
        });
        return parseResponse(res);
    });
}
// parse the rpc response and throw if any of the different types of errors occur
function parseResponse(res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!res.ok)
            throw new Error(res.statusText);
        const json = yield res.json();
        // NOTE: we are leaving behind the error code because the Error type does not allow for a `code` property
        if (json.error)
            throw new Error(json.error.message);
        if (!json.result)
            throw new Error("Malformed RPC response");
        return json;
    });
}
function GeneralizedRPC(method, params) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            jsonrpc: "2.0",
            method: `tableland_${method}`,
            id: 1,
            params: [params],
        };
    });
}
function hash(query) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const message = yield GeneralizedRPC.call(this, "validateCreateTable", {
            create_statement: query,
        });
        if (!this.token) {
            yield this.siwe();
        }
        const json = yield SendCall.call(this, message, (_a = this.token) === null || _a === void 0 ? void 0 : _a.token);
        return camelCaseKeys(json.result);
    });
}
function validateWriteQuery(query) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const message = yield GeneralizedRPC.call(this, "validateWriteQuery", {
            statement: query,
        });
        if (!this.token) {
            yield this.siwe();
        }
        const json = yield SendCall.call(this, message, (_a = this.token) === null || _a === void 0 ? void 0 : _a.token);
        return camelCaseKeys(json.result);
    });
}
function read(query, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options.output)
            options.output = "table";
        const message = yield GeneralizedRPC.call(this, "runReadQuery", Object.assign({ statement: query }, options));
        const json = yield SendCall.call(this, message);
        return json.result.data;
    });
}
// Note: This method returns right away, once the write request has been sent to a validator for
//       writing to the Tableland smart contract. However, the write is not confirmed until a validator
//       has picked up the write event from the smart contract, and digested the event locally.
function write(query) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const message = yield GeneralizedRPC.call(this, "relayWriteQuery", {
            statement: query,
        });
        if (!this.token) {
            yield this.siwe();
        }
        const json = yield SendCall.call(this, message, (_a = this.token) === null || _a === void 0 ? void 0 : _a.token);
        return camelCaseKeys(json.result.tx);
    });
}
function receipt(txnHash) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const message = yield GeneralizedRPC.call(this, "getReceipt", {
            txn_hash: txnHash,
        });
        if (!this.token) {
            yield this.siwe();
        }
        const json = yield SendCall.call(this, message, (_a = this.token) === null || _a === void 0 ? void 0 : _a.token);
        if (json.result.receipt) {
            return camelCaseKeys(json.result.receipt);
        }
        return undefined;
    });
}
function setController(tableId, controller, caller) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        caller = caller !== null && caller !== void 0 ? caller : (yield ((_a = this.signer) === null || _a === void 0 ? void 0 : _a.getAddress()));
        if (typeof caller === "undefined") {
            throw new Error("must have a signer to set controller");
        }
        const message = yield GeneralizedRPC.call(this, "setController", {
            token_id: tableId,
            controller,
            caller,
        });
        if (!this.token) {
            yield this.siwe();
        }
        const json = yield SendCall.call(this, message, (_b = this.token) === null || _b === void 0 ? void 0 : _b.token);
        return camelCaseKeys(json.result.tx);
    });
}
export { hash, list, receipt, read, validateWriteQuery, write, setController };
//# sourceMappingURL=tableland-calls.js.map