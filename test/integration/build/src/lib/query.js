var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as tablelandCalls from "./tableland-calls.js";
import * as ethCalls from "./eth-calls.js";
import { shouldSkipConfirm, shouldRelay } from "./util.js";
import { checkNetwork } from "./check-network.js";
export function resultsToObjects({ rows, columns }) {
    return rows.map((row) => Object.fromEntries(row.map((k, i) => [columns[i].name, k])));
}
export function read(query, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield tablelandCalls.read.call(this, query, options);
    });
}
export function write(query, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const skipConfirm = shouldSkipConfirm(options);
        const doRelay = shouldRelay(this, options);
        if (doRelay) {
            const response = yield tablelandCalls.write.call(this, query);
            if (!skipConfirm) {
                const confirmation = yield this.waitConfirm(response.hash);
                if (confirmation.error)
                    throw new Error(confirmation.error);
            }
            return response;
        }
        // We check the wallet and tableland chains match here again in
        // case the user switched networks after creating a siwe token
        yield checkNetwork.call(this);
        // ask the Validator if this query is valid, and get the tableId for use in SC call
        const { tableId } = yield tablelandCalls.validateWriteQuery.call(this, query);
        const txn = yield ethCalls.runSql.call(this, tableId, query);
        if (!skipConfirm) {
            const confirmation = yield this.waitConfirm(txn.transactionHash);
            if (confirmation.error)
                throw new Error(confirmation.error);
        }
        return { hash: txn.transactionHash };
    });
}
//# sourceMappingURL=query.js.map