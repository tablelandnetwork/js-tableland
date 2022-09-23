import { Signer } from "ethers";
/**
 * Token is signed SIWE token.
 */
export interface Token {
    token: string;
}
export declare function userCreatesToken(signer: Signer, chainId: number, uri: string): Promise<Token>;
