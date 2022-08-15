import { ContractReceipt } from "ethers";
import { TablelandTables__factory as TablelandTablesFactory } from "@tableland/evm";
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
  const tx = await contract.createTable(address, query);

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
  const tx = await contract.runSQL(address, tableId, query);

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
  const tx = await contract.setController(caller, tableId, controller);

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
  const tx = await contract.lockController(caller, tableId);

  return await tx.wait();
}

export { registerTable, runSql, setController, getController, lockController };
