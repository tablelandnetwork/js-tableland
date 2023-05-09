import { Typed } from "ethers";
import {
  type SignerConfig,
  extractChainId,
  extractSigner,
} from "../helpers/config.js";
import { type TableIdentifier, getContractAndOverrides } from "./contract.js";

export async function listTables(
  config: SignerConfig,
  owner?: string
): Promise<TableIdentifier[]> {
  const chainId = await extractChainId(config);
  const signer = await extractSigner(config);
  const address = owner ?? (await signer.getAddress());

  const { contract, overrides } = await getContractAndOverrides(
    signer,
    chainId
  );
  const tokens = await contract.tokensOfOwner(
    Typed.address(address),
    overrides
  );
  return tokens.map((token) => ({ tableId: token.toString(), chainId }));
}
