import { type SignerConfig } from "../helpers/config.js";
import { type ContractTransaction } from "../helpers/ethers.js";
import { validateTableName } from "../helpers/parser.js";
import { getContractAndOverrides } from "./contract.js";

// Match _anything_ between create table and schema portion of create statement
const firstSearch =
  /(?<create>^CREATE\s+TABLE\s+)(?<name>\S+)(?<schema>\s*\(.*\)[;]?$)/i;
// Match _anything_ between pairs of "", ``, '', or []
const secondSearch =
  /(?<=^")(.*?)(?="$)|(?<=^\[)(.*?)(?=\]$)|(?<=^')(.*?)(?='$)|(?<=^`)(.*?)(?=`$)|(^[^[`'].*?[^\]'`]$)/;

export interface PrepareParams {
  /**
   * SQL statement string.
   */
  statement: string;
  /**
   * The target chain id.
   */
  chainId: number;
  /**
   * The first table name in a series of SQL statements.
   */
  first: string;
}

export async function prepareCreateTable({
  statement,
  chainId,
  first,
}: PrepareParams): Promise<CreateTableParams & { prefix: string }> {
  const { prefix, name: tableName } = await validateTableName(
    `${first}_${chainId}`,
    true
  );
  const stmt = statement.replace(
    firstSearch,
    function (_, create: string, name: string, schema: string) {
      const newName = name.replace(secondSearch, function (sub, ...args) {
        if (sub != null) {
          return tableName;
        }
        /* c8 ignore next */
        return sub;
      });
      return create + newName + schema;
    }
  );
  return { statement: stmt, chainId, prefix };
}

export interface CreateTableParams {
  /**
   * SQL statement string.
   */
  statement: string;
  /**
   * The target chain id.
   */
  chainId: number;
}

export async function createTable(
  { signer }: SignerConfig,
  { statement, chainId }: CreateTableParams
): Promise<ContractTransaction> {
  const owner = await signer.getAddress();
  const { contract, overrides } = await getContractAndOverrides(
    signer,
    chainId
  );
  return await contract.createTable(owner, statement, overrides);
}
