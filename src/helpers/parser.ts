import {
  init,
  __wasm,
  type NormalizedStatement,
  type ValidatedTable,
  type StatementType,
} from "@tableland/sqlparser";
import { isTestnet } from "./chains.js";

export type { NormalizedStatement, StatementType };

export async function normalize(sql: string): Promise<NormalizedStatement> {
  if (typeof sql !== "string") {
    throw new Error("SQL statement must be a String");
  }
  /* c8 ignore next 3 */
  if (__wasm == null) {
    await init();
  }
  return await sqlparser.normalize(sql);
}

export async function validateTableName(
  tableName: string,
  isCreate = false
): Promise<ValidatedTable> {
  if (typeof tableName !== "string") {
    throw new Error("table name must be a String");
  }
  /* c8 ignore next 3 */
  if (__wasm == null) {
    await init();
  }
  return await sqlparser.validateTableName(tableName, isCreate);
}

export async function validateTables({
  tables,
  type,
}: Omit<NormalizedStatement, "statements">): Promise<ValidatedTable[]> {
  /* c8 ignore next 3 */
  if (__wasm == null) {
    await init();
  }
  const validatedTables = await Promise.all(
    tables.map(
      async (tableName) =>
        await sqlparser.validateTableName(tableName, type === "create")
    )
  );
  const same: boolean | null = validatedTables
    .map((tbl) => isTestnet(tbl.chainId))
    /* c8 ignore next */
    .reduce((a, b): any => (a === b ? a : null));
  if (same == null) {
    throw new Error("network mismatch: mix of testnet and mainnet chains");
  }
  return validatedTables;
}
