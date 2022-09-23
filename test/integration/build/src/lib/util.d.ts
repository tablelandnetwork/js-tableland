import { Signer } from "ethers";
import { Connection, ReceiptResult, ConfirmOptions, PrefixOptions, RelayOptions, SkipConfirmOptions, TimeoutOptions } from "./connection.js";
export declare function getSigner(): Promise<Signer>;
export declare const btoa: any;
export declare const Buffer: any;
export declare type NetworkName = "testnet" | "staging" | "custom";
export declare type ChainName = "ethereum" | "optimism" | "polygon" | "ethereum-goerli" | "optimism-kovan" | "optimism-goerli" | "arbitrum-goerli" | "polygon-mumbai" | "optimism-kovan-staging" | "optimism-goerli-staging" | "local-tableland" | "custom";
export interface SupportedChain {
    name: string;
    phrase: string;
    chainId: number;
    contract: string;
    host: string;
    rpcRelay: boolean;
}
export declare const SUPPORTED_CHAINS: Record<ChainName, SupportedChain>;
export declare function camelCaseKeys(obj: any): any;
export declare function waitConfirm(this: Connection, txnHash: string, options?: ConfirmOptions): Promise<ReceiptResult>;
export declare function getPrefix(options?: PrefixOptions): string;
export declare function shouldSkipConfirm(options?: SkipConfirmOptions): boolean;
export declare function shouldRelay(connection: Connection, options?: RelayOptions): boolean;
export declare const defaultTimeout: number;
export declare function getTimeout(options?: TimeoutOptions): number;
