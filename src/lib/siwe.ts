import { Connection } from "./connection.js";
import { Token, userCreatesToken } from "./token.js";
import { checkNetwork } from "./check-network.js";

export async function siwe(this: Connection): Promise<Token> {
  // calling this ensures that we have a signer
  await checkNetwork.call(this);

  this.token = await userCreatesToken(
    this.signer!,
    this.options.chainId,
    this.options.siweUri
  );
  return this.token;
}
