import { Connection } from "./connection.js";
import { Token, userCreatesToken } from "./token.js";
import { getSigner } from "./util.js";

export async function siwe(this: Connection): Promise<Token> {
  await this.checkNetwork();

  // Typescript wants this check here even though it's also done in `checkNetwork`
  this.signer = this.signer ?? (await getSigner());
  this.token = await userCreatesToken(this.signer, this.options.chainId);
  return this.token;
}
