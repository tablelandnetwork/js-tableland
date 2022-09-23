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
export function list() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        this.signer = (_a = this.signer) !== null && _a !== void 0 ? _a : (yield getSigner());
        const address = yield this.signer.getAddress();
        const res = yield fetch(`${this.options.host}/chain/${this.options.chainId}/tables/controller/${address}`).then((r) => r.json());
        return res;
    });
}
//# sourceMappingURL=list.js.map