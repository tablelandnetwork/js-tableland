import { TableMetadata, Connection } from "./connection.js";
import { getSigner, camelCaseKeys } from "./util.js";

export async function list(this: Connection): Promise<TableMetadata[]> {
  this.signer = this.signer ?? (await getSigner());
  const address = await this.signer.getAddress();

  const res = await fetch(
    `${this.options.host}/chain/${this.options.chainId}/tables/controller/${address}`
  ).then((r) => r.json());

  return camelCaseKeys(res);
}
