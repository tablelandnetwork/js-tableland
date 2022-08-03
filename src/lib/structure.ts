import { StructureQueryResult, Connection } from "./connection.js";

export async function structure(
  this: Connection,
  hash: string
): Promise<StructureQueryResult[]> {
  const res = await fetch(
    `${this.options.host}/chain/${this.options.chainId}/tables/structure/${hash}`
  ).then((r) => r.json());

  return res;
}
