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

// see `errorWithHint` for usage
const hints = [
  {
    regexp: /syntax error at position \d+ near '.+'/,
    template: function (statement: string, match: any): string {
      const location = Number(match.input.slice(match.index).split(" ")[4]);
      if (isNaN(location)) return "";

      const termMatch = match.input.match(
        /syntax error at position \d+ (near '.+')/
      );
      if (
        termMatch == null ||
        termMatch.length < 1 ||
        termMatch[1].indexOf("near '") !== 0
      ) {
        return "";
      }

      // isolate the term from the matched string
      const term = termMatch[1].slice(6, -1);

      const padding = " ".repeat(location - term.length);
      const carrots = "^".repeat(term.length);

      return `${statement}
${padding}${carrots}`;
    },
  },
  {
    regexp: /no such column/,
    template: function (statement: string, match: any): string {
      // note: the error returned from the validator, and the one generated in the client
      // in the client already include the name of the column.
      return statement;
    },
  },
];

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

export function errorWithHint(statement: string, cause: Error): Error {
  if (cause.message == null || statement == null) return cause;

  let errorMessage = cause.message;
  try {
    for (let i = 0; i < hints.length; i++) {
      const hint = hints[i];
      const match = errorMessage.match(hint.regexp);
      if (match == null) continue;

      const hintMessage = hint.template(statement, match);
      errorMessage += hintMessage !== "" ? `\n${hintMessage}` : "";
      break;
    }

    return new Error(errorMessage, { cause });
  } catch (err) {
    return cause;
  }
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
      throw new Error(`no such column: ${colName.toString()}`);
    }
    return row[colName];
  });
}
