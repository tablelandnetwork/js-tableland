/* eslint-disable node/no-unpublished-import */
import { ContractReceipt } from "ethers";
import { CreateTableOptions, Connection } from "../interfaces.js";
import * as tablelandCalls from "./tableland-calls.js";
import { registerTable } from "./eth-calls.js";
/**
 * Registers an NFT with the Tableland Ethereum smart contract, then uses that to register
 * a new Table on Tableland
 * @param {string} query SQL create statement. Must include 'id' as primary key.
 * @param {CreateTableOptions} options List of options
 * @returns {string} The token ID of the table created
 */
export async function create(
  this: Connection,
  query: string,
  options: CreateTableOptions = {}
): Promise<ContractReceipt> {
  const authorized = await tablelandCalls.checkAuthorizedList.call(this);
  if (!authorized) throw new Error("You are not authorized to create a table");
  // Validation

  // This "dryrun" is done to validate that the query statement is considered valid.
  // We check this before minting the token, so the caller won't succeed at minting a token
  // then fail to create the table on the Tableland network
  await tablelandCalls.create.call(this, query, "1", {
    dryrun: true,
    ...options,
  });

  return await registerTable.call(this, query);

  // TODO: we can potentially listen to Execution Tracker here and wait to return
}
