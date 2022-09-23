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
import { getAccounts } from "@tableland/local";
import { connect } from "../../src/main.js";
import { ethers } from "ethers";
import { setup } from "./setupTest.js";
let connection;
// Starting the local network takes quite a while
test("create method: setup", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setup(t);
        const provider = new ethers.providers.JsonRpcProvider();
        const wallet = new ethers.Wallet(getAccounts()[1].privateKey, provider);
        connection = connect({
            chain: "local-tableland",
            signer: wallet
        });
    });
});
test("create method: Creating table works", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const txReceipt = yield connection.create("id int primary key, val text");
        t.equal(!!txReceipt.tableId._hex.match(/^0x0[1-9]/), true);
    });
});
test("create method: Creating table throws if validation fails", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        let createError = new Error();
        try {
            yield connection.create("id int primary key, val text", {
                prefix: "123test",
            });
        }
        catch (err) {
            createError = err;
        }
        t.equal(createError.message, "calling ValidateCreateTable parsing create table statement: unable to parse the query: syntax error at position 16 near '123'");
    });
});
test("create method: Creating table accepts skipConfirm option", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const txReceipt = yield connection.create("id int primary key, val text", {
            skipConfirm: true,
        });
        t.equal(!!txReceipt.tableId._hex.match(/^0x0[1-9]/), true);
    });
});
//# sourceMappingURL=createTable.test.js.map