import { TableMetadata, Connection } from "../interfaces.js";

export async function list(this: Connection): Promise<TableMetadata[]> {
  const address = await this.signer.getAddress();

  // TODO: this check is potentially too restrictive, see issue #22
  const providerNetwork = await this.signer.provider?.getNetwork();
  const chainId = providerNetwork?.chainId ?? "5";

  const resp: TableMetadata[] = await fetch(
    `${this.host}/chain/${chainId}/tables/controller/${address}`
  ).then((r) => r.json());

  return resp;
}
