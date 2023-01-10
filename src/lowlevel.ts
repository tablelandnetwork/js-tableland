import {
  type Config,
  extractBaseUrl,
  extractSigner,
  type Signal,
  type ReadConfig,
} from "./helpers/index.js";
import { prepareCreateTable, createTable } from "./registry/create.js";
import { prepareRunSQL, runSQL } from "./registry/run.js";
import {
  type ExtractedStatement,
  type WaitableTransactionReceipt,
  wrapTransaction,
} from "./registry/utils.js";
import {
  type ObjectsFormat,
  type ValueOf,
  getQuery,
} from "./validator/query.js";
import { ApiError } from "./validator/index.js";

export async function exec(
  config: Config,
  { type, sql, tables: [first] }: ExtractedStatement
): Promise<WaitableTransactionReceipt> {
  const signer = await extractSigner(config);
  const chainId = await signer.getChainId();
  const baseUrl = await extractBaseUrl(config, chainId);
  const _config = { baseUrl, signer };
  const _params = { chainId, first, statement: sql };
  switch (type) {
    case "create": {
      const { prefix, ...prepared } = await prepareCreateTable(_params);
      const tx = await createTable(_config, prepared);
      return await wrapTransaction(_config, prefix, tx);
    }
    /* c8 ignore next */
    case "acl":
    case "write": {
      const { prefix, ...prepared } = await prepareRunSQL(_params);
      const tx = await runSQL(_config, prepared);
      return await wrapTransaction(_config, prefix, tx);
    }
    /* c8 ignore next 2 */
    default:
      throw new Error("invalid statement type: read");
  }
}

export function errorWithCause(code: string, cause: Error): Error {
  return new Error(`${code}: ${cause.message}`, { cause });
}

function catchNotFound(err: unknown): [] {
  if (err instanceof ApiError && err.status === 404) {
    return [];
  }
  throw err;
}

export async function queryRaw<T = unknown>(
  config: ReadConfig,
  statement: string,
  opts: Signal = {}
): Promise<Array<ValueOf<T>>> {
  const params = { statement, format: "table" } as const;
  const response = await getQuery<T>(config, params, opts)
    .then((res) => res.rows)
    .catch(catchNotFound);
  return response;
}

export async function queryAll<T = unknown>(
  config: ReadConfig,
  statement: string,
  opts: Signal = {}
): Promise<ObjectsFormat<T>> {
  const params = { statement, format: "objects" } as const;
  const response = await getQuery<T>(config, params, opts).catch(catchNotFound);
  return response;
}

export async function queryFirst<T = unknown>(
  config: ReadConfig,
  statement: string,
  opts: Signal = {}
): Promise<T | null> {
  const response = await queryAll<T>(config, statement, opts).catch(
    catchNotFound
  );
  return response.shift() ?? null;
}

export function extractColumn<T = unknown, K extends keyof T = keyof T>(
  values: T,
  colName: K
): T[K];
export function extractColumn<T = unknown, K extends keyof T = keyof T>(
  values: T[],
  colName: K
): Array<T[K]>;
export function extractColumn<T = unknown, K extends keyof T = keyof T>(
  values: T[] | T,
  colName: K
): Array<T[K]> | T[K] {
  const array = Array.isArray(values) ? values : [values];
  return array.map((row: T) => {
    if (row[colName] === undefined) {
      throw new Error(`column not found: ${colName.toString()}`);
    }
    return row[colName];
  });
}
