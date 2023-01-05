import { type Result } from "./registry/index.js";
import {
  type Config,
  type AutoWaitConfig,
  extractBaseUrl,
  type ChainName,
  getBaseUrl,
  type Signal,
  type Signer,
  normalize,
} from "./helpers/index.js";
import { Statement } from "./statement.js";

export class Database<D = unknown> {
  readonly config: Config & Partial<AutoWaitConfig>;

  constructor(config: Config & Partial<AutoWaitConfig> = {}) {
    this.config = config;
  }

  static async readOnly(chainNameOrId: ChainName | number): Promise<Database> {
    const baseUrl = getBaseUrl(chainNameOrId);
    return new Database({ baseUrl });
  }

  static async forSigner(signer: Signer): Promise<Database> {
    const baseUrl = await extractBaseUrl({ signer });
    return new Database({ signer, baseUrl });
  }

  prepare<T = D>(sql: string): Statement<T> {
    return new Statement<T>(this.config, sql);
  }

  /**
   * @param statements
   * @returns
   */
  async batch<T = D>(
    statements: Statement[],
    opts: Signal = {}
  ): Promise<Array<Result<T>>> {
    try {
      const normalized = await Promise.all(
        statements.map(async (stmt) => await normalize(stmt.toString()))
      );
      const type: string | null = normalized
        .map((stmt) => stmt.type)
        .reduce((a, b): any => (a === b ? a : null));
      if (type == null) {
        throw new Error(
          "statement error: batch must contain uniform types (e.g., CREATE, INSERT, SELECT, etc)"
        );
      }
      // Reads can be done "concurrently"
      if (type === "read") {
        const results = await Promise.all(
          statements.map(async (stmt) => {
            return await stmt.all<T>(undefined, opts);
          })
        );
        return results;
      }
      // Mutating queries are sent as a single query to the smart contract
      const sql = statements.map((stmt) => stmt.toString()).join(";");
      const result = await this.prepare(sql).all<T>(undefined, opts);
      return [result];
    } catch (cause: any) {
      if (cause.message === "ALL_ERROR") {
        throw new Error("BATCH_ERROR", { cause: cause.cause });
      }
      throw new Error("BATCH_ERROR", { cause });
    }
  }

  // TODO: Note that this appears to be the wrong return type in practice.
  async exec<T = D>(
    statementStrings: string,
    opts: Signal = {}
  ): Promise<Result<T>> {
    try {
      const { statements } = await normalize(statementStrings);
      const count = statements.length;
      const statement = this.prepare(statementStrings);
      const result = await statement.run(opts);
      // Adds a count property which isn't typed
      result.meta.count = count;
      return result;
    } catch (cause: any) {
      if (cause.message === "RUN_ERROR") {
        throw new Error("EXEC_ERROR", { cause: cause.cause });
      }
      throw new Error("EXEC_ERROR", { cause });
    }
  }

  async dump(_opts: Signal = {}): Promise<ArrayBuffer> {
    throw new Error("DUMP_ERROR", { cause: new Error("not implemented yet") });
  }
}
