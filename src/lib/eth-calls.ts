/* eslint-disable-next-line camelcase */
import { TablelandTables__factory } from "@textile/eth-tableland";
import { TableRegistrationReceipt, Connection } from "../interfaces";

async function registerTable(
  this: Connection
): Promise<TableRegistrationReceipt> {
  const signer = this.signer;
  const address = await signer.getAddress();
  /* eslint-disable-next-line camelcase */

  const network = this.network;

  const contractAddresses: { [index: string]: string } = {
    staging: "0x30867AD98A520287CCc28Cde70fCF63E3Cdb9c3C",
    testnet: "0x847645b7dAA32eFda757d3c10f1c82BFbB7b41D0",
  };

  const contract = TablelandTables__factory.connect(
    contractAddresses[network],
    signer
  );

  const tx = await contract.safeMint(address);

  const receipt = await tx.wait();
  const [event] = receipt.events ?? [];

  return {
    receipt,
    tableId: event.args?.tokenId,
  };
}

export { registerTable };
