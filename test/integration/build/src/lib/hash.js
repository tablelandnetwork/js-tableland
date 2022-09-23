var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getPrefix } from "./util.js";
import * as tablelandCalls from "./tableland-calls.js";
/**
 * Takes a Create Table SQL statement and returns the structure hash that would be generated
 * @param {string} schema The schema component of a SQL CREATE statement. See `create` for details.
 * @param {string} prefix The table name prefix.
 * @returns {string} The structured hash of the table that would be created.
 */
export function hash(schema, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { chainId } = this.options;
        const prefix = getPrefix(options);
        const query = `CREATE TABLE ${prefix}_${chainId} (${schema});`;
        return yield tablelandCalls.hash.call(this, query);
    });
}
//# sourceMappingURL=hash.js.map