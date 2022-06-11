import { Connection, CreateTableReceipt } from "./connection.js";
import * as tablelandCalls from "./tableland-calls.js";
import { registerTable } from "./eth-calls.js";
// import { userCreatesToken } from "./token.js";
import { BigNumber } from "ethers";
/**
 * Registers an NFT with the Tableland Ethereum smart contract, then uses that to register
 * a new Table on Tableland. This method returns after the tableId has been minted, but not
 * nessessarily before the Tableland network has picked up the CREATE TABLE event. Use
 * the `receipt` method on the returned `txnHash` to check the status of the table.
 * @param {string} schema SQL table schema.
 * @returns {string} A Promise that resolves to a pending table creation receipt.
 */
export async function create(
  this: Connection,
  schema: string,
  prefix: string = ""
): Promise<CreateTableReceipt> {
  const { chainId } = this.options;
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
  return { tableId, prefix, chainId, txnHash, blockNumber, name };
}
