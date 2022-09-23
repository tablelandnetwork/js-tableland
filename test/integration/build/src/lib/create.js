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
import { getPrefix, getTimeout, shouldSkipConfirm } from "./util.js";
import { checkNetwork } from "./check-network.js";
/**
 * Registers an NFT with the Tableland Ethereum smart contract, then uses that to register
 * a new Table on Tableland. This method returns after the table has been confirmed in the
 * Validator unless the `skipConfirm` option is set to true
 * @param {string} schema SQL table schema.
 * @param {string} prefix The table name prefix.
 * @returns {string} A Promise that resolves to a pending table creation receipt.
 */
export function create(schema, options) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        // We check the wallet and tableland chains match here again in
        // case the user switched networks after creating a siwe token
        yield checkNetwork.call(this);
        const { chainId } = this.options;
        const prefix = getPrefix(options);
        const skipConfirm = shouldSkipConfirm(options);
        const timeout = getTimeout(options);
        const query = `CREATE TABLE ${prefix}_${chainId} (${schema});`;
        // This "dryrun" is done to validate that the query statement is considered valid.
        // We check this before minting the token, so the caller won't succeed at minting a token
        // then fail to create the table on the Tableland network
        yield tablelandCalls.hash.call(this, query);
        const txn = yield ethCalls.createTable.call(this, query);
        const [, event] = (_a = txn.events) !== null && _a !== void 0 ? _a : [];
        const txnHash = txn.transactionHash;
        const blockNumber = txn.blockNumber;
        const tableId = (_b = event === null || event === void 0 ? void 0 : event.args) === null || _b === void 0 ? void 0 : _b.tableId;
        const name = `${prefix}_${chainId}_${tableId}`;
        if (!skipConfirm) {
            yield this.waitConfirm(txnHash, { timeout });
        }
        return { tableId, prefix, chainId, txnHash, blockNumber, name };
    });
}
//# sourceMappingURL=create.js.map