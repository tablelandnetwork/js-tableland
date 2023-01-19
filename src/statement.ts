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
  type Signal,
  normalize,
} from "./helpers/index.js";
import {
  type ExtractedStatement,
  type Result,
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
} from "./lowlevel.js";

export { type ValuesType, type Parameters, type ValueOf, type BaseType };

export class Statement<S = unknown> {
  private readonly config: Config & Partial<AutoWaitConfig>;
  private readonly sql: string;
  private readonly parameters?: Parameters;

  constructor(
    config: Config & Partial<AutoWaitConfig>,
    sql: string,
    parameters?: Parameters
  ) {
    this.config = config;
    this.sql = sql.trim();
    this.parameters = parameters;
  }

  /**
   * Bind a set of values to the parameters of the prepared statement.
   * We follow the SQLite convention for prepared statements parameter binding.
   * We support Ordered (?NNNN), Anonymous (?), and Named (@name, :name, $name) parameters.
   * @param values A variadic list of values to bind. May include base types, and objects.
   * @returns A bound Statement.
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
      throw errorWithCause("BIND_ERROR", cause);
    }
  }

  toObject(): { sql: string; parameters?: Parameters } {
    return {
      sql: this.sql,
      parameters: this.parameters,
    };
  }

  async #parseAndExtract(): Promise<ExtractedStatement> {
    const statementWithBindings = this.toString();
    const { type, statements, tables } = await normalize(statementWithBindings);
    // Stick with original if a create statement, otherwise, use the parsed version
    // This is because the parser injects keywords that are not spec compliant
    // See https://github.com/tablelandnetwork/go-sqlparser/issues/41
    const sql =
      type === "create" ? statementWithBindings : statements.join(";");
    return { type, sql, tables };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async all<T = S, K extends keyof T = keyof T>(
    colName?: undefined,
    opts?: Signal
  ): Promise<Result<T>>;
  async all<T = S, K extends keyof T = keyof T>(
    colName: K,
    opts?: Signal
  ): Promise<Result<T[K]>>;
  async all<T = S, K extends keyof T = keyof T>(
    colName?: K,
    opts: Signal = {}
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
          let receipt = await exec(this.config, { type, sql, tables });
          if (this.config.autoWait ?? false) {
            const waited = await receipt.wait();
            receipt = { ...receipt, ...waited };
          }

          return wrapResult(receipt, performance.now() - start);
        }
      }
    } catch (cause: any) {
      if (
        cause instanceof Error &&
        cause.message.includes("column not found")
      ) {
        throw errorWithCause("COLUMN_NOTFOUND", cause);
      }
      throw errorWithCause("ALL_ERROR", cause);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async first<T = S, K extends keyof T = keyof T>(): Promise<T>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async first<T = S, K extends keyof T = keyof T>(
    colName: undefined,
    opts?: Signal
  ): Promise<T>;
  async first<T = S, K extends keyof T = keyof T>(
    colName: K,
    opts?: Signal
  ): Promise<T[K] | null>;
  async first<T = S, K extends keyof T = keyof T>(
    colName?: K,
    opts: Signal = {}
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
          const receipt = await exec(this.config, { type, sql, tables });
          /* c8 ignore next */
          if (this.config.autoWait ?? false) {
            await receipt.wait();
          }
          return null;
        }
      }
    } catch (cause: any) {
      if (
        cause instanceof Error &&
        cause.message.includes("column not found")
      ) {
        throw errorWithCause("COLUMN_NOTFOUND", cause);
      }
      throw errorWithCause("FIRST_ERROR", cause);
    }
  }

  async run(opts: Signal = {}): Promise<Result<never>> {
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
          let receipt = await exec(this.config, { type, sql, tables });
          if (this.config.autoWait ?? false) {
            const waited = await receipt.wait();
            receipt = { ...receipt, ...waited };
          }
          return wrapResult(receipt, performance.now() - start);
        }
      }
    } catch (cause: any) {
      throw errorWithCause("RUN_ERROR", cause);
    }
  }

  async raw<T = S>(opts: Signal = {}): Promise<Array<ValueOf<T>>> {
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
          const receipt = await exec(this.config, { type, sql, tables });
          /* c8 ignore next */
          if (this.config.autoWait ?? false) {
            await receipt.wait();
          }
          return [];
        }
      }
    } catch (cause: any) {
      throw errorWithCause("RAW_ERROR", cause);
    }
  }
}
