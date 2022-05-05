import { TableMetadata, Connection } from "../interfaces.js";

export async function list(this: Connection): Promise<TableMetadata[]> {
  const address = await this.signer.getAddress();

  const resp: TableMetadata[] = await fetch(
    `${this.host}/tables/controller/${address}`,
    {
      headers: {
        Authorization: `Bearer ${this.token.token}`,
      },
    }
  ).then((r) => r.json());

  return resp;
}
