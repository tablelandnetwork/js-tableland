import { BigNumber } from "ethers";
import { Connection, CreateTableReceipt, CreateOptions } from "./connection.js";
import * as tablelandCalls from "./tableland-calls.js";
import * as ethCalls from "./eth-calls.js";
import { getPrefix, getTimeout, shouldSkipConfirm } from "./util.js";
import { checkNetwork } from "./check-network.js";

/**
 * Registers an NFT with the Tableland Ethereum smart contract, then uses that to register
 * a new Table on Tableland. This method returns after the table has been confirmed in the
 * Validator unless the `skipConfirm` option is set to true
 * @param {string} schema SQL table schema.
 * @param {string} prefix The table name prefix.
 * @returns {string} A Promise that resolves to a pending table creation receipt.
 */
export async function create(
  this: Connection,
  schema: string,
  options?: CreateOptions
): Promise<CreateTableReceipt> {
  // We check the wallet and tableland chains match here again in
  // case the user switched networks after creating a siwe token
  await checkNetwork.call(this);

  const { chainId } = this.options;
  const prefix = getPrefix(options);
  const skipConfirm = shouldSkipConfirm(options);
  const timeout = getTimeout(options);

  const query = `CREATE TABLE ${prefix}_${chainId} (${schema});`;

  // This "dryrun" is done to validate that the query statement is considered valid.
  // We check this before minting the token, so the caller won't succeed at minting a token
  // then fail to create the table on the Tableland network
  await tablelandCalls.hash.call(this, query);

  const txn = await ethCalls.createTable.call(this, query);

  const [, event] = txn.events ?? [];
  const txnHash = txn.transactionHash;
  const blockNumber = txn.blockNumber;
  const tableId: BigNumber | undefined = event?.args?.tableId;
  const name = `${prefix}_${chainId}_${tableId}`;

  if (!skipConfirm) {
    await this.waitConfirm(txnHash, { timeout });
  }

  return { tableId, prefix, chainId, txnHash, blockNumber, name };
}
