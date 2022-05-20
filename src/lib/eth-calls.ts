import { ContractReceipt } from "ethers";
/* eslint-disable-next-line camelcase */
import { TablelandTables__factory } from "@tableland/eth";
import { Connection } from "../interfaces.js";
import { contractAddresses } from "./util.js";

async function registerTable(
  this: Connection,
  query: string
): Promise<ContractReceipt> {
  const signer = this.signer;
  const address = await signer.getAddress();
  /* eslint-disable-next-line camelcase */

  const contractAddress = this.contract || contractAddresses[this.network];

  if (!contractAddress)
    throw new Error(`no contract found for ${this.network} network`);

  const contract = TablelandTables__factory.connect(contractAddress, signer);
  const tx = await contract.createTable(address, query);

  return await tx.wait();
}

export { registerTable };
