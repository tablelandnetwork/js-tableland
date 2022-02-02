/* eslint-disable node/no-missing-import */
// eslint-disable-next-line node/no-unpublished-import, camelcase
import { TablelandTables__factory } from "@textile/eth-tableland";
import { ContractReceipt } from "ethers";
import { getSigner } from "./single.js";

interface TableRegistration {
  receipt: ContractReceipt;
  tableId: string;
}

async function registerTable(): Promise<TableRegistration> {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const contract = TablelandTables__factory.connect(
    // TODO: Extra to abstraction
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
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
