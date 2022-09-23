import { Signer } from "ethers";
import { Token } from "./token.js";
import { NetworkName, ChainName } from "./util.js";
import { Connection } from "./connection.js";
/**
 * Options to control client connection with Tableland, EVM, and Gateway.
 */
export interface ConnectOptions {
    token?: Token;
    signer?: Signer;
    host?: string;
    network?: NetworkName;
    chain?: ChainName;
    chainId?: number;
    contract?: string;
    rpcRelay?: boolean;
    siweUri?: string;
}
/**
 * Create client connection with Tableland, EVM, and Gateway.
 * @param options Options to control client connection.
 * @returns Promise that resolves to a Connection object.
 */
export declare function connect(options: ConnectOptions): Connection;
