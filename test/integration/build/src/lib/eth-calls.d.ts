import { ContractReceipt } from "ethers";
import { Connection } from "./connection.js";
declare function createTable(this: Connection, query: string): Promise<ContractReceipt>;
declare function runSql(this: Connection, tableId: number, query: string): Promise<ContractReceipt>;
declare function setController(this: Connection, tableId: number, controller: string): Promise<ContractReceipt>;
declare function getController(this: Connection, tableId: number): Promise<string>;
declare function lockController(this: Connection, tableId: number): Promise<ContractReceipt>;
export { createTable, runSql, setController, getController, lockController };
