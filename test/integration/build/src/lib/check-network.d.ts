import { Connection } from "./connection.js";
/**
 * Ensures that a connection signer's network and the connection's tableland network
 * are using the same chain.
 * If this isn't called before smart contract method calls there is a chance the
 * transaction will happen on the wrong chain which results in unintended behaviour
 * @returns {string} A Promise that resolves to undefined.
 */
export declare function checkNetwork(this: Connection): Promise<void>;
