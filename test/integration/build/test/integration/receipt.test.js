var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import test from "tape";
import { ethers } from "ethers";
import { getAccounts } from "@tableland/local";
import { connect } from "../../src/main.js";
import { setup } from "./setupTest.js";
let connection;
test("receipt method: setup", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setup(t);
        const provider = new ethers.providers.JsonRpcProvider();
        const wallet = new ethers.Wallet(getAccounts()[17].privateKey, provider);
        connection = connect({
            chain: "local-tableland",
            signer: wallet
        });
    });
});
test("receipt method: Can get receipt of a processed transaction", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const { txnHash } = yield connection.create("a int");
        const receipt = yield connection.receipt(txnHash);
        t.equal(receipt.chainId, 31337);
        t.equal(receipt.txnHash, txnHash);
        t.equal(typeof receipt.blockNumber, "number");
        t.equal(typeof receipt.tableId, "string");
    });
});
test("receipt method: Returns undefined for unprocessed transaction", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const receipt = yield connection.receipt("0x0000000000adf2ed24c61bd0d2f52bef11fca7f0d7e5a703a1e58a7fb2958d0e");
        t.equal(receipt, undefined);
    });
});
//# sourceMappingURL=receipt.test.js.map