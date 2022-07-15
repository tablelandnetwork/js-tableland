import { Connection } from "./connection.js";
import { getSigner } from "./util.js";

/**
 * Ensures that a connection signer's network and the connection's tableland network
 * are using the same chain.
 * If this isn't called before smart contract method calls there is a chance the
 * transaction will happen on the wrong chain which results in unintended behaviour
 * @returns {string} A Promise that resolves to undefined.
 */
export async function checkNetwork(this: Connection): Promise<void> {
  this.signer = this.signer ?? (await getSigner());

  if (!this.signer.provider) {
    throw new Error("provider is required");
  }

  const { chainId } = await this.signer.provider.getNetwork();

  if (!this.options.chainId || chainId !== this.options.chainId) {
    throw new Error(
      "provider chain and tableland network mismatch. Switch your wallet connection and reconnect"
    );
  }
}
