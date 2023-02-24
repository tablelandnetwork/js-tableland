import { strictEqual, rejects } from "assert";
import { describe, test } from "mocha";
import { normalize, validateTableName } from "../src/helpers/parser.js";

describe("parser", function () {
  describe("normalize()", function () {
    test("when called incorrectly", async function () {
      await rejects(
        // @ts-expect-error need to tell ts to ignore this since we are testing a failure when used without ts
        normalize(123),
        (err: any) => {
          strictEqual(err.message, "SQL statement must be a String");
          return true;
        }
      );
    });
  });

  describe("validateTableName()", function () {
    test("when called incorrectly", async function () {
      await rejects(
        // @ts-expect-error need to tell ts to ignore this since we are testing a failure when used without ts
        validateTableName(123),
        (err: any) => {
          strictEqual(err.message, "table name must be a String");
          return true;
        }
      );
    });
  });
});
