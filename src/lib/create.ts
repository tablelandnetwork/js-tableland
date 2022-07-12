import { BigNumber } from "ethers";
import { Connection, CreateTableReceipt, MethodOptions } from "./connection.js";
import * as tablelandCalls from "./tableland-calls.js";
import { registerTable } from "./eth-calls.js";
import { getPrefix, shouldSkipConfirm } from "./util.js";

/**
 * Registers an NFT with the Tableland Ethereum smart contract, then uses that to register
 * a new Table on Tableland. This method returns after the tableId has been minted, but not
 * nessessarily before the Tableland network has picked up the CREATE TABLE event. Use
 * the `receipt` method on the returned `txnHash` to check the status of the table.
 * @param {string} schema SQL table schema.
 * @param {string} prefix The table name prefix.
 * @returns {string} A Promise that resolves to a pending table creation receipt.
 */
export async function create(
  this: Connection,
  schema: string,
  // TODO: changing how this function is called would require a major version bump
  //       making it polymophic lets us keep it in the current major verision.
  //       when bump major remember to change this arg to only be `MethodOptions`
  options?: MethodOptions | string
): Promise<CreateTableReceipt> {
  // We check the wallet and tableland chains match here again in
  // case the user switched networks after creating a siwe token
  await this.checkNetwork();

  const { chainId } = this.options;
  const prefix = getPrefix(options);
  const skipConfirm = shouldSkipConfirm(options);

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

  if (!skipConfirm) await this.onMaterialize(txnHash);

  return { tableId, prefix, chainId, txnHash, blockNumber, name };
}
