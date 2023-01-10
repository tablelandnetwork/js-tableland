import { type SignerConfig } from "../helpers/config.js";
import { type TableIdentifier, getContractAndOverrides } from "./contract.js";

export async function listTables(
  { signer }: SignerConfig,
  owner?: string
): Promise<TableIdentifier[]> {
  const address = owner ?? (await signer.getAddress());
  const chainId = await signer.getChainId();
  signer._checkProvider();
  const { contract, overrides } = await getContractAndOverrides(
    signer,
    chainId
  );
  const tokens = await contract.tokensOfOwner(address, overrides);
  return tokens.map((token) => ({ tableId: token.toString(), chainId }));
}
