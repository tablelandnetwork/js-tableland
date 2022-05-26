import { ContractReceipt } from "ethers";
import { Connection } from "../interfaces.js";
import * as tablelandCalls from "./tableland-calls.js";
import { registerTable } from "./eth-calls.js";
/**
 * Registers an NFT with the Tableland Ethereum smart contract, then uses that to register
 * a new Table on Tableland
 * @param {string} query SQL create statement.
 * @returns {string} The smart contract transaction receipt.
 */
export async function create(
  this: Connection,
  schema: string,
  prefix: string = ""
): Promise<ContractReceipt> {
  // TODO: This is realted to issue#22, we might end up doing something like `await this.provider.getNetwork();`
  const providerNetwork = await this.signer.provider?.getNetwork();
  const chainId = providerNetwork?.chainId;
  if (!chainId) throw new Error("cannot create table without provider network");

  const query = `CREATE TABLE ${prefix}_${chainId} (${schema});`;
  // This "dryrun" is done to validate that the query statement is considered valid.
  // We check this before minting the token, so the caller won't succeed at minting a token
  // then fail to create the table on the Tableland network
  await tablelandCalls.hash.call(this, query);

  const txn = await registerTable.call(this, query);

  // TODO: we can potentially listen to Execution Tracker here and wait to return
  //       until we have the receipt, but I'm sure if that makes sense.
  // const receipt = await tablelandCalls.receipt.call(this, txn.transactionHash)
  // console.log(receipt);
  return txn;
}
