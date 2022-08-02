import { SchemaQueryResult, Connection } from "./connection.js";

export async function schema(
  this: Connection,
  tableName: string
): Promise<SchemaQueryResult> {
  const res = await fetch(`${this.options.host}/schema/${tableName}`).then(
    (r) => r.json()
  );

  return res;
}
