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
test("list method: setup", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setup(t);
        const provider = new ethers.providers.JsonRpcProvider();
        const wallet = new ethers.Wallet(getAccounts()[0].privateKey, provider);
        connection = connect({
            chain: "local-tableland",
            signer: wallet
        });
    });
});
test("list method: When I fetch my tables, I get some tables", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const resp = yield connection.list();
        const table = resp[0];
        t.equal(table.name, "healthbot_31337_1");
        t.equal(typeof table.structure, "string");
        t.equal(table.structure.length, 64);
    });
});
// TODO: need to get a second connection for wallet without any tables
test.skip("list method: If I have no tables, I get empty Array", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const provider = new ethers.providers.JsonRpcProvider();
        const wallet = new ethers.Wallet(getAccounts()[18].privateKey, provider);
        const connection1 = connect({
            chain: "local-tableland",
            signer: wallet
        });
        const resp = yield connection1.list();
        t.equal(resp, []);
    });
});
//# sourceMappingURL=list.test.js.map