import { TablelandTables__factory } from "@textile/eth-tableland";
import { ContractReceipt } from "ethers";
import { getSigner } from "./single";


const rinkbyContract = "0x30867AD98A520287CCc28Cde70fCF63E3Cdb9c3C"

interface TableRegistrationReceipt {
  receipt: ContractReceipt;
  tableId: string;
}

async function registerTable(): Promise<TableRegistrationReceipt> {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const contract = TablelandTables__factory.connect(
    rinkbyContract,
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
