var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { TablelandTables__factory as TablelandTablesFactory } from "@tableland/evm";
import { getSigner } from "./util.js";
function createTable(query) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        this.signer = (_a = this.signer) !== null && _a !== void 0 ? _a : (yield getSigner());
        const address = yield this.signer.getAddress();
        const contractAddress = this.options.contract;
        const contract = TablelandTablesFactory.connect(contractAddress, this.signer);
        const opts = yield getOverrides(this.signer);
        const tx = yield contract.createTable(address, query, opts);
        return yield tx.wait();
    });
}
function runSql(tableId, query) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        this.signer = (_a = this.signer) !== null && _a !== void 0 ? _a : (yield getSigner());
        const address = yield this.signer.getAddress();
        const contractAddress = this.options.contract;
        const contract = TablelandTablesFactory.connect(contractAddress, this.signer);
        const opts = yield getOverrides(this.signer);
        const tx = yield contract.runSQL(address, tableId, query, opts);
        return yield tx.wait();
    });
}
function setController(tableId, controller) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        this.signer = (_a = this.signer) !== null && _a !== void 0 ? _a : (yield getSigner());
        const caller = yield this.signer.getAddress();
        const contractAddress = this.options.contract;
        const contract = TablelandTablesFactory.connect(contractAddress, this.signer);
        const opts = yield getOverrides(this.signer);
        const tx = yield contract.setController(caller, tableId, controller, opts);
        return yield tx.wait();
    });
}
function getController(tableId) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        this.signer = (_a = this.signer) !== null && _a !== void 0 ? _a : (yield getSigner());
        const contractAddress = this.options.contract;
        const contract = TablelandTablesFactory.connect(contractAddress, this.signer);
        return yield contract.getController(tableId);
    });
}
function lockController(tableId) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        this.signer = (_a = this.signer) !== null && _a !== void 0 ? _a : (yield getSigner());
        const caller = yield this.signer.getAddress();
        const contractAddress = this.options.contract;
        const contract = TablelandTablesFactory.connect(contractAddress, this.signer);
        const opts = yield getOverrides(this.signer);
        const tx = yield contract.lockController(caller, tableId, opts);
        return yield tx.wait();
    });
}
function getOverrides(signer) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // Hack: Revert to gasPrice to avoid always underpriced eip-1559 transactions on Polygon
        const opts = {};
        const network = yield ((_a = signer.provider) === null || _a === void 0 ? void 0 : _a.getNetwork());
        if ((network === null || network === void 0 ? void 0 : network.chainId) === 137) {
            const feeData = yield signer.getFeeData();
            if (feeData.gasPrice) {
                opts.gasPrice =
                    Math.floor(feeData.gasPrice.toNumber() * 1.1) || undefined;
            }
        }
        return opts;
    });
}
export { createTable, runSql, setController, getController, lockController };
//# sourceMappingURL=eth-calls.js.map