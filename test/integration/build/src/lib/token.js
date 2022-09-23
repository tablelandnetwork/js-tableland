var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SiweMessage, generateNonce } from "siwe";
import { btoa } from "./util.js";
// Utilities and constants
const { stringify } = JSON;
/**
 * Create a JWS.
 * @param signer The signer. Any object that satisfies the Signer interface. Used to sign the message for the token
 * @param params Options that are passed directly to SiweMessage.
 * @returns A Promise that resolves to the full JWS string.
 */
function createToken(signer, params) {
    return __awaiter(this, void 0, void 0, function* () {
        // Creates the message object
        const message = new SiweMessage(Object.assign(Object.assign({ 
            // TODO: Validator doesn't make use of the nonce ATM
            nonce: generateNonce(), domain: "Tableland" }, params), { address: yield signer.getAddress() }));
        const messageText = message.toMessage();
        /**
         * Generates the message to be signed and uses the provider to ask for a signature
         */
        const signature = yield signer.signMessage(message.prepareMessage());
        const token = btoa(stringify({
            message: messageText,
            signature,
        }));
        return { token };
    });
}
export function userCreatesToken(signer, chainId, uri) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = Date.now();
        const exp = new Date(now + 10 * 60 * 60 * 1000).toISOString(); // Default to ~10 hours
        return yield createToken(signer, {
            chainId,
            expirationTime: exp,
            uri,
            version: "1",
            statement: "Official Tableland SDK",
        });
    });
}
//# sourceMappingURL=token.js.map