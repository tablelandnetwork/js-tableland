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
test("hash method: setup", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setup(t);
        const provider = new ethers.providers.JsonRpcProvider();
        const wallet = new ethers.Wallet(getAccounts()[4].privateKey, provider);
        connection = connect({
            chain: "local-tableland",
            signer: wallet
        });
    });
});
test("hash method: Hashing a table works", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        const schema = "id int primary key, val text";
        const prefix = "hello";
        const hashResponse = yield connection.hash(schema, { prefix });
        t.equal(hashResponse.structureHash, "07c04291a6e489c27b7b2c03cfa535a2d5f91220ed0e0aacba93cef635501455");
    });
});
test("hash method: Hashing a table throws if statement is not valid", function (t) {
    return __awaiter(this, void 0, void 0, function* () {
        let hashError = new Error();
        try {
            yield connection.hash("(id int primary key, val text);", {
                prefix: "123hello}",
            });
        }
        catch (err) {
            hashError = err;
        }
        t.equal(hashError.message, "calling ValidateCreateTable parsing create table statement: unable to parse the query: syntax error at position 16 near '123'");
    });
});
//# sourceMappingURL=structureHash.test.js.map