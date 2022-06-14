import { Connection } from "./connection.js";
import { Token, userCreatesToken } from "./token.js";
import { getSigner } from "./util.js";

export async function siwe(this: Connection): Promise<Token> {
  this.signer = this.signer ?? (await getSigner());
  const chainId = this.options.chainId;

  this.token = await userCreatesToken(this.signer, chainId);
  return this.token;
}
