import {
  type ValuesType,
  type Parameters,
  type BaseType,
  getParameters,
  bindValues,
} from "./helpers/binding.js";
import {
  type AutoWaitConfig,
  type Config,
  type SignalAndInterval,
  checkWait,
  normalize,
} from "./helpers/index.js";
import {
  type ExtractedStatement,
  type Result,
  type WaitableTransactionReceipt,
  extractReadonly,
  wrapResult,
} from "./registry/utils.js";
import { type ValueOf } from "./validator/query.js";
import {
  extractColumn,
  queryAll,
  queryFirst,
  queryRaw,
  exec,
  errorWithCause,
  errorWithHint,
} from "./lowlevel.js";

export { type ValuesType, type Parameters, type ValueOf, type BaseType };

/**
 * Statement defines a single SQL statement.
 * Both static and prepared statements are supported. In the current
 * implementation, the prepared statements are prepared locally, and
 * executed remotely (on-chain).
 * Mutating transactions such as INSERTs, DELETEs, and UPDATEs produce
 * a two-phase transaction. Firstly, the transaction is sent to the
 * registry contract, and awaited. The returned `txn` information also
 * contains a `wait` method than can be used to await finalization on
 * the Tableland network. This method will also throw an exception if
 * any runtime errors occur.
 */
export class Statement<S = unknown> {
  private readonly config: Config & Partial<AutoWaitConfig>;
  private readonly sql: string;
  private readonly parameters?: Parameters;

  constructor(
    config: Config & Partial<AutoWaitConfig>,
    sql: string,
    parameters?: Parameters
  ) {
    if (typeof sql !== "string") {
      throw new Error("SQL statement must be a String");
    }

    this.config = config;
    this.sql = sql.trim();
    this.parameters = parameters;
  }

  /**
   * Bind a set of values to the parameters of the prepared statement.
   * We follow the SQLite convention for prepared statements parameter binding.
   * We support Ordered (?NNNN), Anonymous (?), and Named (@name, :name, $name) parameters.
   * @param values A variadic list of values to bind. May include base types, and objects.
   * @returns A new bound Statement.
   */
  bind<T = S>(...values: ValuesType[]): Statement<T> {
    const parameters = getParameters(...values);
    return new Statement(this.config, this.sql, parameters);
  }

  /**
   * Resolve a bound statement to a SQL string.
   * @returns A valid SQL string.
   */
  toString(): string {
    try {
      return bindValues(this.sql, this.parameters);
    } catch (cause: any) {
      const hint = errorWithHint(this.sql, cause);
      throw errorWithCause("BIND_ERROR", hint);
    }
  }

  /**
   * Export a Statement's sql string and parameters.
   * @returns
   */
  toObject(): { sql: string; parameters?: Parameters } {
    return {
      sql: this.sql,
      parameters: this.parameters,
    };
  }

  async #parseAndExtract(): Promise<ExtractedStatement> {
    const statementWithBindings = this.toString();
    const nameMap =
      typeof this.config.aliases?.read === "function"
        ? await this.config.aliases.read()
        : undefined;
    const { type, statements, tables } = await normalize(
      statementWithBindings,
      nameMap
    );

    // TODO: this feels wrong, but we have to use the normalize function to determine the type,
    //    then use it again if the type is create to ensure that a new table isn't created with
    //    an existing prefix.
    if (type === "create" && nameMap != null) {
      const { tables } = await normalize(statementWithBindings);
      // if the table prefix already exists throw an error
      if (tables.find((table) => table in nameMap) != null) {
        throw new Error("table name already exists in aliases");
      }
    }

    // Stick with original if a create statement, otherwise, use the parsed version
    // This is because the parser injects keywords that are not spec compliant
    // See https://github.com/tablelandnetwork/go-sqlparser/issues/41
    const sql =
      type === "create" ? statementWithBindings : statements.join(";");

    return { type, sql, tables };
  }

  async #waitExec(
    params: ExtractedStatement
  ): Promise<WaitableTransactionReceipt> {
    return await checkWait(this.config, await exec(this.config, params));
  }

  /**
   * Executes a query and returns all rows and metadata.
   * @param colName If provided, filter results to the provided column.
   * @param opts Additional options to control execution.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async all<T = S, K extends keyof T = keyof T>(
    colName?: undefined,
    opts?: SignalAndInterval
  ): Promise<Result<T>>;
  async all<T = S, K extends keyof T = keyof T>(
    colName: K,
    opts?: SignalAndInterval
  ): Promise<Result<T[K]>>;
  async all<T = S, K extends keyof T = keyof T>(
    colName?: K,
    opts: SignalAndInterval = {}
  ): Promise<Result<T | T[K]>> {
    try {
      const start = performance.now();
      const { sql, type, tables } = await this.#parseAndExtract();
      switch (type) {
        case "read": {
          const config = await extractReadonly(this.config, {
            type,
            tables,
          });
          const results = await queryAll<T>(config, sql, opts);
          if (colName != null) {
            return wrapResult(
              extractColumn(results, colName),
              performance.now() - start
            );
          }
          return wrapResult(results, performance.now() - start);
        }
        default: {
          return wrapResult<T>(
            await this.#waitExec({ ...opts, type, sql, tables }),
            performance.now() - start
          );
        }
      }
    } catch (cause: any) {
      const hint = errorWithHint(this.sql, cause);
      throw errorWithCause("ALL_ERROR", hint);
    }
  }

  /**
   * Executes a query and returns the first row of the results.
   * This does not return metadata like the other methods.
   * Instead it returns the object directly. If the query returns no
   * rows, then first() will return null.
   * @param colName If provided, filter results to the provided column.
   * @param opts Additional options to control execution.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async first<T = S, K extends keyof T = keyof T>(): Promise<T>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async first<T = S, K extends keyof T = keyof T>(
    colName: undefined,
    opts?: SignalAndInterval
  ): Promise<T>;
  async first<T = S, K extends keyof T = keyof T>(
    colName: K,
    opts?: SignalAndInterval
  ): Promise<T[K] | null>;
  async first<T = S, K extends keyof T = keyof T>(
    colName?: K,
    opts: SignalAndInterval = {}
  ): Promise<T | T[K] | null> {
    try {
      const { sql, type, tables } = await this.#parseAndExtract();
      switch (type) {
        case "read": {
          const config = await extractReadonly(this.config, {
            type,
            tables,
          });
          const results = await queryFirst<T>(config, sql, opts);
          if (results == null || colName == null) {
            return results;
          }
          return extractColumn(results, colName);
        }
        default: {
          await this.#waitExec({
            ...opts,
            type,
            sql,
            tables,
          });
          return null;
        }
      }
    } catch (cause: any) {
      const hint = errorWithHint(this.sql, cause);
      throw errorWithCause("FIRST_ERROR", hint);
    }
  }

  /**
   * Runs the query/queries, but returns no results. Instead, run()
   * returns the metrics only. Useful for write operations like
   * UPDATE, DELETE or INSERT.
   * @param opts Additional options to control execution.
   * @returns A results object with metadata only (results are null or an empty array).
   */
  async run(opts: SignalAndInterval = {}): Promise<Result<never>> {
    try {
      const start = performance.now();
      const { sql, type, tables } = await this.#parseAndExtract();
      switch (type) {
        case "read": {
          const config = await extractReadonly(this.config, {
            type,
            tables,
          });
          const results = await queryAll<never>(config, sql, opts);
          return wrapResult(results, performance.now() - start);
        }
        default: {
          return wrapResult(
            await this.#waitExec({ ...opts, type, sql, tables }),
            performance.now() - start
          );
        }
      }
    } catch (cause: any) {
      const hint = errorWithHint(this.sql, cause);
      throw errorWithCause("RUN_ERROR", hint);
    }
  }

  /**
   * Same as stmt.all(), but returns an array of rows instead of objects.
   * @param opts Additional options to control execution.
   * @returns An array of raw query results.
   */
  async raw<T = S>(opts: SignalAndInterval = {}): Promise<Array<ValueOf<T>>> {
    try {
      const { sql, type, tables } = await this.#parseAndExtract();
      switch (type) {
        case "read": {
          const config = await extractReadonly(this.config, {
            type,
            tables,
          });
          return await queryRaw<T>(config, sql, opts);
        }
        default: {
          await this.#waitExec({
            ...opts,
            type,
            sql,
            tables,
          });
          return [];
        }
      }
    } catch (cause: any) {
      const hint = errorWithHint(this.sql, cause);
      throw errorWithCause("RAW_ERROR", hint);
    }
  }
}
