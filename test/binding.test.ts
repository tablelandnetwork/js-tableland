import { deepStrictEqual } from "assert";
import { describe, test } from "mocha";
import {
  getParameters,
  bindValues,
  ValuesType,
  Parameters,
} from "../src/helpers/binding.js";

describe("binding", function () {
  let parameters: Parameters;
  describe("getParameters()", function () {
    test("where all combinations of input parameters are used", function () {
      const values: ValuesType[] = [
        45,
        { name: "Hen'ry" },
        [54, true, Uint8Array.from([1, 2, 3])],
        null,
      ];
      parameters = getParameters(...values);
      const expected: Parameters = {
        anon: [45, 54, true, Uint8Array.from([1, 2, 3]), null],
        named: { name: "Hen'ry" },
      };
      deepStrictEqual(parameters, expected);
    });
  });
  describe("bindValues()", function () {
    test("where multiple combinations of placeholders are used", function () {
      const sql =
        "INSERT INTO people VALUES (@name, ?, :name, ?, '?', ?4, ?3, ?)";
      const actual = bindValues(sql, parameters);
      const expected =
        "INSERT INTO people VALUES ('Hen''ry', 45, 'Hen''ry', 54, '?', X'010203', 1, NULL)";
      deepStrictEqual(actual, expected);
    });

    test("where all supported data types are used", function () {
      class RowId {
        toSQL(): string {
          return "_rowid_";
        }
      }
      const now = new Date();
      const anon = [
        { some: "json" }, // json
        "string", // string
        true, // boolean
        42, // int
        BigInt(100), // bigint
        3.14, // real
        now, // date
        Uint8Array.from([1, 2, 3]), // bytes
        null, // null
        undefined, // undefined
        new RowId(), // toSQL,
        () => "An arbitrary function", // toString will be used
      ];
      const sql =
        "INSERT INTO people VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      const actual = bindValues(sql, { anon });
      const expected =
        `INSERT INTO people VALUES (` +
        `'{"some":"json"}', 'string', 1, 42, 100, 3.14, ` +
        `${now.valueOf()}, X'010203', NULL, NULL, _rowid_, ` +
        `'() => "An arbitrary function"')`;
      deepStrictEqual(actual, expected);
    });
  });
});
