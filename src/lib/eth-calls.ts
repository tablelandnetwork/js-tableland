import { ContractReceipt } from "@ethersproject/contracts";
import { Registry, Registry__factory } from "@textile/eth-tableland";



import { getSigner } from './single';


async function registerTable(): Promise<ContractReceipt> {
    let signer = await getSigner();
    let address = await signer.getAddress();
    let contract = Registry__factory.connect("0xContractAddress, I guess?", signer);
    
    const id = await "0"; // contract.TABLE_TOKEN_ID();
    


    contract.balanceOf(await address, id);
    const tx = await contract.mint(address, 0, 1, "0x00");
    const receipt = await tx.wait();
    return receipt;
}


export {
    registerTable
};