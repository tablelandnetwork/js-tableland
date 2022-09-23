import { Connection, CreateTableReceipt, CreateOptions } from "./connection.js";
/**
 * Registers an NFT with the Tableland Ethereum smart contract, then uses that to register
 * a new Table on Tableland. This method returns after the table has been confirmed in the
 * Validator unless the `skipConfirm` option is set to true
 * @param {string} schema SQL table schema.
 * @param {string} prefix The table name prefix.
 * @returns {string} A Promise that resolves to a pending table creation receipt.
 */
export declare function create(this: Connection, schema: string, options?: CreateOptions): Promise<CreateTableReceipt>;
