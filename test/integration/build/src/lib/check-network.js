var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getSigner } from "./util.js";
/**
 * Ensures that a connection signer's network and the connection's tableland network
 * are using the same chain.
 * If this isn't called before smart contract method calls there is a chance the
 * transaction will happen on the wrong chain which results in unintended behaviour
 * @returns {string} A Promise that resolves to undefined.
 */
export function checkNetwork() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        this.signer = (_a = this.signer) !== null && _a !== void 0 ? _a : (yield getSigner());
        if (!this.signer.provider) {
            throw new Error("provider is required");
        }
        const { chainId } = yield this.signer.provider.getNetwork();
        if (!this.options.chainId || chainId !== this.options.chainId) {
            throw new Error("provider chain and tableland network mismatch. Switch your wallet connection and reconnect");
        }
    });
}
//# sourceMappingURL=check-network.js.map