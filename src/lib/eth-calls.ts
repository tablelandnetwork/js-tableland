// eslint-disable-next-line camelcase
import { Registry__factory } from "@awmuncy/cheese";
import { ContractReceipt } from "ethers";
import { v4 } from "uuid";

import { getSigner } from "./single.js";

interface TableRegistration {
  receipt: ContractReceipt;
  tableId: string;
}

async function registerTable(): Promise<TableRegistration> {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const contract = Registry__factory.connect(
    // TODO: Extra to abstraction
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    signer
  );

  const uuid = "0x" + v4().replace(/-/g, "");

  /* Kill this */
  localStorage.setItem(uuid, "mine");

  const tx = await contract.mintOne(address, uuid);
  setTimeout(async () => {
    console.log(await contract.balanceOf(address, uuid));
  }, 30000);

  const receipt = await tx.wait();
  return {
    receipt,
    tableId: uuid,
  };
}

async function doIOwn(tableId: string): Promise<boolean> {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const contract = Registry__factory.connect(
    // TODO: Extra to abstraction
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    signer
  );

  const res = contract.balanceOf(address, tableId);

  console.log(res);
  return false;
}

export { registerTable, doIOwn };
