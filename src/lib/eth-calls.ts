import { TablelandTables__factory as TablelandTablesFactory } from "@tableland/evm";
import { Overrides, ContractReceipt, Signer } from "ethers";
import { Connection } from "./connection.js";
import { getSigner } from "./util.js";

async function registerTable(
  this: Connection,
  query: string
): Promise<ContractReceipt> {
  this.signer = this.signer ?? (await getSigner());
  const address = await this.signer.getAddress();

  const contractAddress = this.options.contract;

  const contract = TablelandTablesFactory.connect(contractAddress, this.signer);
  const opts = await getOverrides(this.signer);
  const tx = await contract.createTable(address, query, opts);

  return await tx.wait();
}

async function runSql(
  this: Connection,
  tableId: number,
  query: string
): Promise<ContractReceipt> {
  this.signer = this.signer ?? (await getSigner());
  const address = await this.signer.getAddress();

  const contractAddress = this.options.contract;

  const contract = TablelandTablesFactory.connect(contractAddress, this.signer);
  const opts = await getOverrides(this.signer);
  const tx = await contract.runSQL(address, tableId, query, opts);

  return await tx.wait();
}

async function setController(
  this: Connection,
  tableId: number,
  controller: string
): Promise<ContractReceipt> {
  this.signer = this.signer ?? (await getSigner());
  const caller = await this.signer.getAddress();

  const contractAddress = this.options.contract;

  const contract = TablelandTablesFactory.connect(contractAddress, this.signer);
  const opts = await getOverrides(this.signer);
  const tx = await contract.setController(caller, tableId, controller, opts);

  return await tx.wait();
}

async function getController(
  this: Connection,
  tableId: number
): Promise<string> {
  this.signer = this.signer ?? (await getSigner());

  const contractAddress = this.options.contract;

  const contract = TablelandTablesFactory.connect(contractAddress, this.signer);
  return await contract.getController(tableId);
}

async function lockController(
  this: Connection,
  tableId: number
): Promise<ContractReceipt> {
  this.signer = this.signer ?? (await getSigner());
  const caller = await this.signer.getAddress();

  const contractAddress = this.options.contract;

  const contract = TablelandTablesFactory.connect(contractAddress, this.signer);
  const opts = await getOverrides(this.signer);
  const tx = await contract.lockController(caller, tableId, opts);

  return await tx.wait();
}

async function getOverrides(signer: Signer): Promise<Overrides> {
  // Hack: Revert to gasPrice to avoid always underpriced eip-1559 transactions on Polygon
  const opts: Overrides = {};
  const network = await signer.provider?.getNetwork();
  if (network?.chainId === 137) {
    const feeData = await signer.getFeeData();
    if (feeData.gasPrice) {
      opts.gasPrice =
        Math.floor(feeData.gasPrice.toNumber() * 1.1) || undefined;
    }
  }
  return opts;
}

export { registerTable, runSql, setController, getController, lockController };
