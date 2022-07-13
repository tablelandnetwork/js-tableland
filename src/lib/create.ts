import { BigNumber } from "ethers";
import { Connection, CreateTableReceipt, MethodOptions } from "./connection.js";
import * as tablelandCalls from "./tableland-calls.js";
import { registerTable } from "./eth-calls.js";
import { getPrefix, getTimeout, shouldSkipConfirm } from "./util.js";

/**
 * Registers an NFT with the Tableland Ethereum smart contract, then uses that to register
 * a new Table on Tableland. This method returns after the table has been confirmed in the
 * Validator unless the `skipConfirm` option is set to true
 * @param {string} schema SQL table schema.
 * @returns {string} A Promise that resolves to a pending table creation receipt.
 */
export async function create(
  this: Connection,
  schema: string,
  // TODO: changing how this function is called would require a major version bump
  //       making it polymophic lets us keep it in the current major verision.
  //       when bump major consider changing this arg to only be `MethodOptions`
  options?: MethodOptions | string
): Promise<CreateTableReceipt> {
  const { chainId } = this.options;
  const prefix = getPrefix(options);
  const skipConfirm = shouldSkipConfirm(options);
  const timeout = getTimeout(options, 120000);

  const query = `CREATE TABLE ${prefix}_${chainId} (${schema});`;

  // This "dryrun" is done to validate that the query statement is considered valid.
  // We check this before minting the token, so the caller won't succeed at minting a token
  // then fail to create the table on the Tableland network
  await tablelandCalls.hash.call(this, query);

  const txn = await registerTable.call(this, query);

  const [, event] = txn.events ?? [];
  const txnHash = txn.transactionHash;
  const blockNumber = txn.blockNumber;
  const tableId: BigNumber | undefined = event?.args?.tableId;
  const name = `${prefix}_${chainId}_${tableId}`;

  if (!skipConfirm) {
    await this.onConfirm(txnHash, { timeout: timeout });
  }

  return { tableId, prefix, chainId, txnHash, blockNumber, name };
}
