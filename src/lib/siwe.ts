import { Connection } from "./connection.js";
import { Token, userCreatesToken } from "./token.js";
import { getSigner } from "./util.js";

export async function siwe(this: Connection): Promise<Token> {
  this.signer = this.signer ?? (await getSigner());

  await this.checkNetwork();

  this.token = await userCreatesToken(this.signer, this.options.chainId);
  return this.token;
}
