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
import { createTable, type CreateTableParams } from "./create.js";
import { runSQL, type RunSQLParams } from "./run.js";

export {
  type Result,
  type Metadata,
  type WaitableTransactionReceipt,
  type Named,
} from "./utils.js";

export {
  type TableIdentifier,
  type CreateTableParams,
  type RunSQLParams,
  type TransferParams,
  type SetParams,
};

export class Registry {
  constructor(readonly config: SignerConfig) {}

  static async forSigner(signer: Signer): Promise<Registry> {
    return new Registry({ signer });
  }

  async listTables(owner?: string): Promise<TableIdentifier[]> {
    return await listTables(this.config, owner);
  }

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
  async createTable(params: CreateTableParams): Promise<ContractTransaction> {
    return await createTable(this.config, params);
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
   * - `msg.sender` must be `caller` or contract owner
   * - `tableId` must exist
   * - `caller` must be authorized by the table controller
   * - `statement` must be less than or equal to 35000 bytes
   */
  async runSQL(params: RunSQLParams): Promise<ContractTransaction> {
    return await runSQL(this.config, params);
  }
}
