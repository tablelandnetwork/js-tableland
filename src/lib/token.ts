import { SiweMessage, generateNonce } from "siwe";
import { Signer } from "ethers";
import { btoa } from "./util";

// Utilities and constants
const { stringify } = JSON;

/**
 * Create a JWS.
 * @param signer The signer. Any object that satisfies the Signer interface. Used to sign the message for the token
 * @param params Options that are passed directly to SiweMessage.
 * @returns A Promise that resolves to the full JWS string.
 */
export async function createToken(
  signer: Signer,
  params: Partial<SiweMessage>
): Promise<{ token: string }> {
  // Creates the message object
  const message = new SiweMessage({
    // TODO: Validator doesn't make use of the nonce ATM
    nonce: generateNonce(),
    domain: "Tableland",
    ...params,
    address: await signer.getAddress(),
  });

  const messageText = message.toMessage();

  /**
   * Generates the message to be signed and uses the provider to ask for a signature
   */
  const signature = await signer.signMessage(message.prepareMessage());

  const token = btoa(
    stringify({
      message: messageText,
      signature: signature,
    })
  );

  return { token: token };
}
