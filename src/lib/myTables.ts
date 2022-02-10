import { TableMetadata, Connection } from "../interfaces";

export async function myTables(this: Connection): Promise<TableMetadata[]> {
  const address = await this.signer.getAddress();

  const resp: TableMetadata[] = await fetch(
    `${this.host}/tables/controller/${address}`
  ).then((r) => r.json());

  return resp;
}
