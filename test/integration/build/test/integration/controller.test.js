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
let tableName;
let tableId;
let connection;
test("controller methods: setup", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setup(t);
        const provider = new ethers.providers.JsonRpcProvider();
        const wallet = new ethers.Wallet(getAccounts()[2].privateKey, provider);
        connection = connect({
            chain: "local-tableland",
            signer: wallet
        });
        const { name, tableId: id } = yield connection.create("colname text", { prefix: "test" });
        if (typeof name !== "string")
            throw new Error("cannot get tablename");
        if (typeof id === "undefined")
            throw new Error("cannot get tableId");
        tableName = name;
        tableId = id.toString();
    });
});
test("controller methods: setting controller succeeds", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield connection.setController(getAccounts()[10].address, tableName);
        t.equal(typeof res.hash, "string");
        t.equal(res.hash.length, 66);
    });
});
test("controller methods: getting controller succeeds", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield connection.getController(tableName);
        t.equal(res, getAccounts()[10].address);
    });
});
test("controller methods: locking controller succeeds", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield connection.lockController(tableId);
        t.equal(typeof res.hash, "string");
        t.equal(res.hash.length, 66);
    });
});
//# sourceMappingURL=controller.test.js.map