import { getSigner, getHost } from "./single";


export interface TableMetadata {
    id: string;
    type: string;
}


export async function myTables(): Promise<TableMetadata[]> {
    const signer = await getSigner();
    const address = await signer.getAddress();
    const host = await getHost();

    const resp: TableMetadata[] = await fetch(
      `${host}/tables/controller/${address}`
    ).then((r) => r.json());
  
    return resp;
}
  