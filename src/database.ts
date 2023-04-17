import { type NormalizedStatement } from "@tableland/sqlparser";
import { type Result, type Runnable } from "./registry/index.js";
import { wrapResult } from "./registry/utils.js";
import {
  type Config,
  type AutoWaitConfig,
  checkWait,
  extractBaseUrl,
  type ChainName,
  getBaseUrl,
  type Signal,
  type Signer,
  normalize,
  validateTableName,
} from "./helpers/index.js";
import { Statement } from "./statement.js";
import { execMutateMany, execCreateMany, errorWithCause } from "./lowlevel.js";

/**
 * Database is the primary API for accessing the Tabeland network as a database.
 * This class provides a small and simple API that will feel very familiar to
 * web2 database users. It includes the concept of prepared statements, SQL
 * parameter binding, execution and query modes, and more. It is actually similar
 * to the better-sqlite3, and D1 APIs in many respects.
 */
export class Database<D = unknown> {
  readonly config: Config & Partial<AutoWaitConfig>;

  /**
   * Create a Database instance with the specified connection configuration.
   * @param config The connection configuration. These keys are evaluated lazily,
   * so it is possible to omit the baseUrl or signer, depending on your query
   * needs. For a read-only Database for instance, only the baseUrl needs to be
   * provided.
   */
  constructor(config: Config & Partial<AutoWaitConfig> = {}) {
    this.config = config;
  }

  /**
   * Create a Database that uses the default baseUrl for a given chain.
   * @deprecated since 4.0.1, will be deleted in 5.0.0
   * @param chainNameOrId The name or id of the chain to target.
   * @returns A Database without a signer configured.
   */
  static readOnly(chainNameOrId: ChainName | number): Database {
    console.warn(
      "`Database.readOnly()` is a depricated method, use `new Database()`"
    );
    const baseUrl = getBaseUrl(chainNameOrId);
    return new Database({ baseUrl });
  }

  /**
   * Create a Database that is connected to the given Signer.
   * @param signer An ethersjs Signer to use for mutating queries.
   * @returns A Database with a Signer, and a default baseUrl.
   */
  static async forSigner(signer: Signer): Promise<Database> {
    const baseUrl = await extractBaseUrl({ signer });
    return new Database({ signer, baseUrl });
  }

  /**
   * Create a new prepared statement.
   * Both static and prepared statements are supported. In the current
   * implementation, the prepared statements are prepared locally, and
   * executed remotely (on-chain).
   * @param sql The SQL statement string to prepare.
   * @returns A Statement object constructed with the given SQL string.
   */
  prepare<T = D>(sql: string): Statement<T> {
    return new Statement<T>(this.config, sql);
  }

  /**
   * Execute a set of Statements in batch mode.
   * Batching sends multiple SQL statements inside a single call to the
   * network. This can have a huge performance impact, as it only sends
   * one transaction to the Tableland smart contract, thereby reducing
   * gas costs.
   * Batched statements are similar to SQL transactions. If a statement
   * in the sequence fails, then an error is returned for that specific
   * statement, and it aborts or rolls back the entire sequence.
   * @param statements A set of Statement objects to batch and submit.
   * @param opts Additional options to control execution.
   * @returns An array of run results.
   */
  //    Note: if we want this package to mirror the D1 package in a way that
  //    enables compatability with packages built to exend D1, then the return type
  //    here will potentially affect if/how those packages work.
  //    D1-ORM is a good example: https://github.com/Interactions-as-a-Service/d1-orm/
  async batch<T = D>(
    statements: Statement[],
    opts: Signal = {}
    // reads returns an Array with legnth equal to the number of batched statements,
    // everything else a single result wrapped in an Array for backward compatability.
    // TODO: In order to work around the Validator API not returning all of the tableIds
    //       and continuing to work in a backward compatable way, it seems that we have to
    //       make this type `any` :(
    //       We should attempt to fix this when the Validator API update happens, or on the
    //       next major version.
  ): Promise<any> {
    try {
      const start = performance.now();
      // If the statement types are "create" and the statement contains more than one
      // query (separated by semi-colon) then the sqlparser with throw an Error.
      const normalized = await Promise.all(
        statements.map(async (stmt) => await normalize(stmt.toString()))
      );

      const type: string | null = normalized
        .map((stmt) => stmt.type)
        .reduce((a, b): any => (a === b ? a : null));
      if (type == null) {
        throw new Error(
          "statement error: batch must contain uniform types (i.e. one of: create, write, read, acl)"
        );
      }

      // "read" statement types are the simple case, we just do each of the queries
      // and return an Array of the query results.
      if (type === "read") {
        return await Promise.all(
          statements.map(async (stmt) => await stmt.all<T>(undefined, opts))
        );
      }

      // For "create" statement types, each statement must be a single create sql query
      if (type === "create") {
        const receipt = await checkWait(
          this.config,
          await execCreateMany(
            this.config,
            statements.map((stmt) => stmt.toString())
          )
        );

        // TODO: wrapping in an Array is required for back compat, consider changing this for next major
        return [wrapResult(receipt, performance.now() - start)];
      }

      if (type !== "write" && type !== "acl") {
        // this should never be thrown, but check in case of something unexpected
        throw new Error("invalid statement type");
      }

      // For "write" and "acl" statement types each Statement object must only affect one table, but
      // that object can have a sql string that has many sql queries separated by semi-colon.
      // If a caller wants to affect 2 tables, they can call `batch` with 2 Statements.
      const runnables = (
        await Promise.all(
          normalized.map(async function (norm) {
            return await normalizedToRunnables(norm);
          })
        )
      ).flat();

      const receipt = await checkWait(
        this.config,
        await execMutateMany(this.config, runnables)
      );

      // TODO: wrapping in an Array is required for back compat, consider changing this for next major
      return [wrapResult(receipt, performance.now() - start)];
    } catch (cause: any) {
      if (cause.message.startsWith("ALL_ERROR") === true) {
        throw errorWithCause("BATCH_ERROR", cause.cause);
      }
      throw errorWithCause("BATCH_ERROR", cause);
    }
  }

  /**
   * Executes one or more queries directly without prepared statements
   * or parameters binding. This method can have poorer performance
   * (prepared statements can be reused in some cases) and, more importantly,
   * is less safe. Only use this method for maintenance and one-shot tasks
   * (example: migration jobs). The input can be one or multiple queries
   * separated by the standard `;`.
   * If an error occurs, an exception is thrown with the query and error
   * messages (see below for `Errors`).
   * Currently, the entire string of statements is submitted as a single
   * transaction. In the future, more "intelligent" transaction planning,
   * splitting, and batching may be used.
   * @param statementStrings A set of SQL statement strings separated by semi-colons.
   * @param opts Additional options to control execution.
   * @returns A single run result.
   */
  async exec<T = D>(
    statementStrings: string,
    opts: Signal = {}
  ): Promise<Result<T>> {
    // TODO: Note that this method appears to be the wrong return type in practice.
    try {
      const { statements } = await normalize(statementStrings);
      const count = statements.length;
      const statement = this.prepare(statementStrings);
      const result = await statement.run(opts);
      // Adds a count property which isn't typed
      result.meta.count = count;
      return result;
    } catch (cause: any) {
      if (cause.message.startsWith("RUN_ERROR") === true) {
        throw errorWithCause("EXEC_ERROR", cause.cause);
      }
      throw errorWithCause("EXEC_ERROR", cause);
    }
  }

  /**
   * Export a (set of) tables to the SQLite binary format.
   * Not implemented yet!
   * @param _opts Additional options to control execution.
   */
  async dump(_opts: Signal = {}): Promise<ArrayBuffer> {
    throw errorWithCause("DUMP_ERROR", new Error("not implemented yet"));
  }
}

/**
 * Take a normalized statement and convert it to a set of Runnables that can be
 * used in a call to the registry contract.
 * @param normalized A normalized statement, e.g. what is returned from the parser's normalize function
 * @returns An Array of Runnables
 */
async function normalizedToRunnables(
  normalized: NormalizedStatement
): Promise<Runnable[]> {
  if (normalized.type !== "write" && normalized.type !== "acl") {
    throw new Error(
      "converting to runnable is only possible for mutate statements"
    );
  }
  if (normalized.tables.length > 1) {
    throw new Error(
      "each statement can only touch one table. try batching statements based on the table they mutate."
    );
  }

  const { tableId } = await validateTableName(normalized.tables[0]);

  return [
    {
      tableId,
      statement: normalized.statements.join(";"),
    },
  ];
}
