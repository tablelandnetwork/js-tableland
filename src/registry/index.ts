import {
  type SignerConfig,
  type Signer,
  type ContractTransaction,
} from "../helpers/index.js";
import { type TableIdentifier } from "./contract.js";
import { listTables } from "./tables.js";
import { safeTransferFrom, type TransferParams } from "./transfer.js";
import {
  setController,
  type SetParams,
  getController,
  lockController,
} from "./controller.js";
import {
  create,
  type CreateOneParams,
  type CreateManyParams,
  type CreateParams,
} from "./create.js";
import {
  mutate,
  type Runnable,
  type RunSQLParams,
  type MutateManyParams,
  type MutateOneParams,
  type MutateParams,
} from "./run.js";

export {
  type Result,
  type Metadata,
  type WaitableTransactionReceipt,
  type Named,
} from "./utils.js";

export {
  type TableIdentifier,
  type CreateOneParams as CreateTableParams, // deprecated
  type CreateOneParams,
  type CreateManyParams,
  type CreateParams,
  type MutateOneParams,
  type MutateManyParams,
  type MutateParams,
  type RunSQLParams, // deprecated
  type Runnable,
  type TransferParams,
  type SetParams,
};

/**
 * Registry provides direct access to remote Registry smart contract APIs.
 */
export class Registry {
  readonly config: SignerConfig;
  /**
   * Create a Registry instance with the specified connection configuration.
   * @param config The connection configuration. This must include an ethersjs
   * Signer. If passing the config from a pre-existing Database instance, it
   * must have a non-null signer key defined.
   */
  constructor(config: Partial<SignerConfig> = {}) {
    /* c8 ignore next 3 */
    if (config.signer == null) {
      throw new Error("missing signer information");
    }
    this.config = config as SignerConfig;
  }

  /**
   * Create a Registry that is connected to the given Signer.
   * @param signer An ethersjs Signer to use for mutating queries.
   */
  static async forSigner(signer: Signer): Promise<Registry> {
    return new Registry({ signer });
  }

  /**
   * Gets the list of table IDs of the requested owner.
   * @param owner The address owning the table.
   */
  async listTables(owner?: string): Promise<TableIdentifier[]> {
    return await listTables(this.config, owner);
  }

  /**
   * Safely transfers the ownership of a given table ID to another address.
   *
   * Requires the msg sender to be the owner, approved, or operator
   */
  async safeTransferFrom(params: TransferParams): Promise<ContractTransaction> {
    return await safeTransferFrom(this.config, params);
  }

  /**
   * Sets the controller for a table. Controller can be an EOA or contract address.
   *
   * When a table is created, it's controller is set to the zero address, which means that the
   * contract will not enforce write access control. In this situation, validators will not accept
   * transactions from non-owners unless explicitly granted access with "GRANT" SQL statements.
   *
   * When a controller address is set for a table, validators assume write access control is
   * handled at the contract level, and will accept all transactions.
   *
   * You can unset a controller address for a table by setting it back to the zero address.
   * This will cause validators to revert back to honoring owner and GRANT bases write access control.
   *
   * caller - the address that is setting the controller
   * tableId - the id of the target table
   * controller - the address of the controller (EOA or contract)
   *
   * Requirements:
   *
   * - contract must be unpaused
   * - `msg.sender` must be `caller` or contract owner and owner of `tableId`
   * - `tableId` must exist
   * - `tableId` controller must not be locked
   */
  async setController(params: SetParams): Promise<ContractTransaction> {
    return await setController(this.config, params);
  }

  /**
   * Locks the controller for a table _forever_. Controller can be an EOA or contract address.
   *
   * Although not very useful, it is possible to lock a table controller that is set to the zero address.
   *
   * caller - the address that is locking the controller
   * tableId - the id of the target table
   *
   * Requirements:
   *
   * - contract must be unpaused
   * - `msg.sender` must be `caller` or contract owner and owner of `tableId`
   * - `tableId` must exist
   * - `tableId` controller must not be locked
   */
  async lockController(
    table: string | TableIdentifier
  ): Promise<ContractTransaction> {
    return await lockController(this.config, table);
  }

  /**
   * Returns the controller for a table.
   *
   * tableId - the id of the target table
   */
  async getController(table: string | TableIdentifier): Promise<string> {
    return await getController(this.config, table);
  }

  /**
   * Creates a new table owned by `owner` using `statement` and returns its `tableId`.
   *
   * owner - the to-be owner of the new table
   * statement - the SQL statement used to create the table
   *
   * Requirements:
   *
   * - contract must be unpaused
   */
  async create(params: CreateParams): Promise<ContractTransaction> {
    return await create(this.config, params);
  }

  /**
   * @custom:deprecated Use `create` instead.
   */
  async createTable(params: CreateOneParams): Promise<ContractTransaction> {
    return await create(this.config, params);
  }

  /**
   * Runs a SQL statement for `caller` using `statement`.
   *
   * caller - the address that is running the SQL statement
   * tableId - the id of the target table
   * statement - the SQL statement to run
   *
   * Requirements:
   *
   * - contract must be unpaused
   * - `msg.sender` must be `caller`
   * - `tableId` must exist
   * - `caller` must be authorized by the table controller
   * - `statement` must be less than 35000 bytes after normalizing
   */
  async mutate(params: MutateParams): Promise<ContractTransaction> {
    return await mutate(this.config, params);
  }

  /**
   * Runs a set of SQL statements for `caller` using `runnables`.
   * @custom:deprecated Using this with a single statement is deprecated. Use `mutate` instead.
   */
  async runSQL(params: MutateParams): Promise<ContractTransaction> {
    return await mutate(this.config, params);
  }
}
