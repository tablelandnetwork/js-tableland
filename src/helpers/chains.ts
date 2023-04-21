import {
  proxies,
  baseURIs,
  type TablelandNetworkConfig,
} from "@tableland/evm/network.js";

/**
 * The set of supported chain names as used by the Tableland network.
 */
export type ChainName = keyof TablelandNetworkConfig;

/**
 * Chain information used to determine defaults for the set of supported chains.
 */
export interface ChainInfo {
  chainName: ChainName;
  chainId: number;
  contractAddress: string;
  baseUrl: string;
  [key: string]: ChainInfo[keyof ChainInfo];
}

// We simply pull this automatically from @tableland/evm to avoid keeping track seperately here.
const entries = Object.entries(proxies) as Array<[ChainName, string]>;
const mapped = entries.map(([chainName, contractAddress]) => {
  const uri = new URL(baseURIs[chainName]);
  const baseUrl = `${uri.protocol}//${uri.host}/api/v1`;
  const chainId = parseInt(
    uri.pathname
      .split("/")
      .filter((v) => v !== "")
      .pop() /* c8 ignore next */ ?? ""
  );
  const entry: [ChainName, any] = [
    chainName,
    { chainName, chainId, contractAddress, baseUrl },
  ];
  return entry;
});

/**
 * The set of chains and their information as supported by the Tableland network.
 */
export const supportedChains = Object.fromEntries(mapped) as Record<
  ChainName,
  ChainInfo
>;

// Not exported
const supportedChainsById = Object.fromEntries(
  Object.values(supportedChains).map((v) => [v.chainId, v])
);

/**
 * Get the default chain information for a given chain name.
 * @param chainNameOrId The requested chain name.
 * @returns An object containing the default chainId, contractAddress, chainName, and baseUrl for the given chain.
 */
export function getChainInfo(chainNameOrId: ChainName | number): ChainInfo {
  const chainInfo =
    typeof chainNameOrId === "number"
      ? supportedChainsById[chainNameOrId]
      : supportedChains[chainNameOrId];

  /* c8 ignore next 3 */
  if (chainInfo == null) {
    throw new Error(`cannot use unsupported chain: ${chainNameOrId}`);
  }

  return chainInfo;
}

export function isTestnet(chainNameOrId: ChainName | number): boolean {
  const includesTestnet =
    getChainInfo(chainNameOrId).baseUrl.includes("testnet");
  return (
    includesTestnet ||
    chainNameOrId === "localhost" ||
    chainNameOrId === "local-tableland" ||
    chainNameOrId === 31337
  );
}

/**
 * Get the default contract address for a given chain name.
 * @param chainNameOrId The requested chain name.
 * @returns A hex string representing the default address for the Tableland registry contract.
 */
export function getContractAddress(chainNameOrId: ChainName | number): string {
  return getChainInfo(chainNameOrId).contractAddress;
}

/**
 * Get the default chain id for a given chain name.
 * @param chainNameOrId The requested chain name.
 * @returns A number representing the default chain id of the requested chain.
 */
export function getChainId(chainNameOrId: ChainName | number): number {
  return getChainInfo(chainNameOrId).chainId;
}

/**
 * Get the default host uri for a given chain name.
 * @param chainNameOrId The requested chain name.
 * @returns A string representing the default host uri for a given chain.
 */
export function getBaseUrl(chainNameOrId: ChainName | number): string {
  return getChainInfo(chainNameOrId).baseUrl;
}

/**
 * Override the internal list of registry addresses and validator urls that will be used for Contract calls and read queries
 * @param chainNameOrId Either the chain name or chainId.  For a list of chain names see the evm-tableland networks file
 * @param values The values you would like to use to override the defaults.
 *  Example: {contractAddress: "0x000deadbeef", baseUrl: "https://my.validator.mydomain.tld"}
 * @returns void
 */
// TODO: It seems important to add this to the docs somewhere since it's the key
//    to using the SDK for the non-default Validator
export function overrideDefaults(
  chainNameOrId: ChainName | number,
  values: Record<keyof ChainInfo, number | string>
): void {
  if (values == null || typeof values !== "object") {
    throw new Error("override values must be an Object");
  }
  for (const [key, value] of Object.entries(values)) {
    if (typeof chainNameOrId === "number") {
      const found = getChainInfo(chainNameOrId);
      found[key] = value;
      supportedChains[found.chainName][key as keyof ChainInfo] = value;
    } else {
      const found = getChainInfo(chainNameOrId);
      found[key] = value;
      supportedChainsById[found.chainId][key as keyof ChainInfo] = value;
    }
  }
}
