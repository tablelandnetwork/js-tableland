import {
  type Signal,
  type SignalAndInterval,
  type ReadConfig,
  type ChainName,
  getBaseUrl,
} from "../helpers/index.js";
import { getHealth } from "./health.js";
import { getVersion, type Version } from "./version.js";
import { getTable, type Table, type Params as TableParams } from "./tables.js";
import {
  getQuery,
  type Params as QueryParams,
  type Format,
  type TableFormat,
  type ObjectsFormat,
} from "./query.js";
import {
  getTransactionReceipt,
  pollTransactionReceipt,
  type TransactionReceipt,
  type Params as ReceiptParams,
} from "./receipt.js";

export { ApiError } from "./client/index.js";
export {
  type TransactionReceipt,
  type Table,
  type TableFormat,
  type ObjectsFormat,
  type QueryParams,
};

export class Validator {
  constructor(readonly config: ReadConfig) {}

  static forChain(chainNameOrId: ChainName | number): Validator {
    const baseUrl = getBaseUrl(chainNameOrId);
    return new Validator({ baseUrl });
  }

  /**
   * Get health status
   * @description Returns OK if the validator considers itself healthy
   */
  async health(opts: Signal = {}): Promise<boolean> {
    return await getHealth(this.config, opts);
  }

  /**
   * Get version information
   * @description Returns version information about the validator daemon
   */
  async version(opts: Signal = {}): Promise<Version> {
    return await getVersion(this.config, opts);
  }

  /**
   * Get table information
   * @description Returns information about a single table, including schema information
   */
  async getTableById(params: TableParams, opts: Signal = {}): Promise<Table> {
    return await getTable(this.config, params);
  }

  /**
   * Query the network
   * @description Returns the results of a SQL read query against the Tabeland network
   */
  async queryByStatement<T = unknown>(
    params: QueryParams<"objects" | undefined>,
    opts?: Signal
  ): Promise<ObjectsFormat<T>>;
  async queryByStatement<T = unknown>(
    params: QueryParams<"table">,
    opts?: Signal
  ): Promise<TableFormat<T>>;
  async queryByStatement<T = unknown>(
    params: QueryParams<Format>,
    opts: Signal = {}
  ): Promise<TableFormat<T> | ObjectsFormat<T>> {
    return await getQuery<T>(this.config, params as any, opts);
  }

  /**
   * Get transaction status
   * @description Returns the status of a given transaction receipt by hash
   */
  async receiptByTransactionHash(
    params: ReceiptParams,
    opts: Signal = {}
  ): Promise<TransactionReceipt> {
    return await getTransactionReceipt(this.config, params, opts);
  }

  /**
   * Wait for transaction status
   * @description Polls for the status of a given transaction receipt by hash until
   */
  async pollForReceiptByTransactionHash(
    params: ReceiptParams,
    opts: SignalAndInterval = {}
  ): Promise<TransactionReceipt> {
    return await pollTransactionReceipt(this.config, params, opts);
  }
}
