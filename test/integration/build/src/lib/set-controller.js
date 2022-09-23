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
import { checkNetwork } from "./check-network.js";
import { shouldRelay } from "./util.js";
/**
 * Set the Controller contract on a table
 * @returns {string} A Promise that resolves to ???.
 */
export function setController(controller, name, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const tableId = name.trim().split("_").pop();
        if (typeof tableId !== "string")
            throw new Error("malformed tablename");
        const doRelay = shouldRelay(this, options);
        if (doRelay) {
            // Note that since tablelandCalls all use the token, the networks are matched during token creation
            return yield tablelandCalls.setController.call(this, tableId, controller);
        }
        // We check the wallet and tableland chains match here again in
        // case the user switched networks after creating a siwe token
        yield checkNetwork.call(this);
        const tableIdInt = parseInt(tableId, 10);
        if (isNaN(tableIdInt))
            throw new Error("invalid tableId was provided");
        const txn = yield ethCalls.setController.call(this, tableIdInt, controller);
        // match the response schema from the relay
        return { hash: txn.transactionHash };
    });
}
//# sourceMappingURL=set-controller.js.map