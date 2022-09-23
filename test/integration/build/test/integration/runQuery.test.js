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
let tableName;
let tableId;
test("read and write methods: setup", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setup(t);
        const provider = new ethers.providers.JsonRpcProvider();
        const wallet = new ethers.Wallet(getAccounts()[17].privateKey, provider);
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
test("read and write methods: returns RPC result when insert query succeeds", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield connection.write(`INSERT INTO ${tableName} (colname) values ('val1');`);
        t.equal(typeof res.hash, "string");
        t.equal(res.hash.length, 66);
    });
});
test("read and write methods: returns RPC result when select query succeeds", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield connection.read(`SELECT * FROM ${tableName};`);
        t.equal(res.columns.length, 1);
        t.equal(res.rows.length, 1);
        t.equal(res.columns[0].name, "colname");
        t.equal(res.rows[0][0], "val1");
    });
});
test("read and write methods: returns RPC result when update query succeeds", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield connection.write(`UPDATE ${tableName} SET colname = 'val3' where colname = 'val1';`);
        t.equal(typeof res.hash, "string");
        t.equal(res.hash.length, 66);
    });
});
test.skip("read and write methods: throws when update fails due to table constraint", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        let updateError = new Error();
        try {
            yield connection.write(`INSERT INTO ${tableName} (colname) values (1);`);
        }
        catch (err) {
            console.log("TEST 1:", err);
            updateError = err;
        }
        t.equal(updateError.message, "violated table constraint");
    });
});
test("read and write methods: validates write query outside of actual transaction", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const { tableId: id } = yield connection.validate(`INSERT INTO ${tableName} (colname) values ('val2');`);
        t.equal(tableId, id);
    });
});
test("read and write methods: write options enable not waiting to return until after confirmation", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield connection.write(`UPDATE ${tableName} SET colname = 'val4' where colname = 'val3';`, { skipConfirm: true });
        t.equal(typeof res.hash, "string");
        t.equal(res.hash.length, 66);
    });
});
test("read and write methods: returns transaction receipt when contract is called directly", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const provider = new ethers.providers.JsonRpcProvider();
        const wallet = new ethers.Wallet(getAccounts()[17].privateKey, provider);
        const connection1 = connect({
            chain: "local-tableland",
            signer: wallet,
            rpcRelay: false
        });
        const txReceipt = yield connection1.write(`INSERT INTO ${tableName} (colname) values ('val5');`);
        t.equal(typeof txReceipt.hash, "string");
        t.equal(txReceipt.hash.length > 10, true);
    });
});
//# sourceMappingURL=runQuery.test.js.map