import { ContractReceipt } from "ethers";
/* eslint-disable-next-line camelcase */
import { TablelandTables__factory } from "@tableland/evm";
import { Connection } from "./connection.js";
import { getSigner } from "./util.js";

async function registerTable(
  this: Connection,
  query: string
): Promise<ContractReceipt> {
  this.signer = this.signer ?? (await getSigner());
  const address = await this.signer.getAddress();

  const contractAddress = this.options.contract;

  const contract = TablelandTables__factory.connect(
    contractAddress,
    this.signer
  );
  const tx = await contract.createTable(address, query);

  return await tx.wait();
}

export { registerTable };
