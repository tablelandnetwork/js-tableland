import { Registry__factory } from "@textile/eth-tableland";
import ethers, { ContractReceipt } from "ethers";

import { getSigner } from "./single";

async function registerTable(): Promise<ContractReceipt> {
  const signer = await (<ethers.Signer>getSigner());
  const address = await signer.getAddress();
  const contract = Registry__factory.connect(
    "0xContractAddress, I guess?",
    signer
  );

  const id = await "0"; // contract.TABLE_TOKEN_ID();

  contract.balanceOf(await address, id);
  const tx = await contract.mint(address, 0, 1, "0x00");
  const receipt = await tx.wait();
  return receipt;
}

export { registerTable };
