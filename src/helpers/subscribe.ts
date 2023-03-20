// TODO: need to see if EventEmitter works in the browser
import { EventEmitter } from "node:events";
import { type TablelandTables } from "@tableland/evm";
import { pollTransactionReceipt } from "../validator/receipt.js";
import {
  getTableIdentifier,
  getContractAndOverrides,
  type TableIdentifier,
} from "../registry/contract.js";
import { extractBaseUrl, type Config } from "../helpers/index.js";

type ContractEventTableIdMap = Record<
  string,
  {
    tableIdIndex: number;
    emit: string;
  }
>;

type ContractMap = Record<number, TablelandTables>;

type ListenerMap = Record<
  string,
  {
    chainId: number;
    tableId: string;
    emitter: EventEmitter;
  }
>;

/**
 * List of the Registry Contract events that will be emitted from the TableEventBus.
 */
// TODO: this is an awkward way to keep track of the index of the Events' tableId index
const contractEvents: ContractEventTableIdMap = {
  RunSQL: {
    tableIdIndex: 2,
    emit: "change",
  },
  TransferTable: {
    tableIdIndex: 2,
    emit: "transfer",
  },
  SetController: {
    tableIdIndex: 0,
    emit: "set-controller",
  },
};

/**
 * TableEventBus provides a way to listen for:
 *  mutations, transfers, and changes to controller
 */
export class TableEventBus {
  readonly config: Config;
  readonly contracts: ContractMap;
  readonly listeners: ListenerMap;

  /**
   * Create a TableEventBus instance with the specified connection configuration.
   * @param config The connection configuration. This must include an ethersjs
   * Signer. If passing the config from a pre-existing Database instance, it
   * must have a non-null signer key defined.
   */
  constructor(config: Partial<Config> = {}) {
    /* c8 ignore next 3 */
    if (config.signer == null) {
      throw new Error("missing signer information");
    }

    this.config = config as Config;
    this.contracts = {};
    this.listeners = {};
  }

  /**
   * Start listening to the Registry Contract for events that are associated
   * with a given table.
   * There's only ever one "listener" for a table, but the emitter that
   * Contract listener has can have as many event listeners as the environment
   * supports.
   * @param tableName The full name of table that you want to listen for
   * changes to.
   */
  async addTableListener(tableName: string): Promise<EventEmitter> {
    if (tableName == null) {
      throw new Error("table name is required to add listener");
    }

    const tableIdentifier = await getTableIdentifier(tableName);
    const listenerId = `_${tableIdentifier.chainId}_${tableIdentifier.tableId}`;
    if (this.listeners[listenerId]?.emitter != null) {
      return this.listeners[listenerId].emitter;
    }

    const emitter = new EventEmitter();

    // If not already listening to the contract we will start listening now,
    // if already listening we will start tracking the new emitter.
    await this._ensureListening(listenerId, emitter);

    this.listeners[listenerId] = {
      ...tableIdentifier,
      emitter,
    };

    return emitter;
  }

  removeTableListener(params: TableIdentifier): void {
    if (params == null) {
      throw new Error("must provide chainId and tableId to remove a listener");
    }

    const listenerId = `_${params.chainId}_${params.tableId}`;
    if (this.listeners[listenerId] == null) {
      throw new Error("cannot remove listener that does not exist");
    }

    const emitter = this.listeners[listenerId].emitter;
    emitter.removeAllListeners();

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.listeners[listenerId];
  }

  // remove all listeners and stop listening to the contract
  removeAllTableListeners(): void {
    // for (const contract in this.contracts) {
    // TODO: remove contract listeners
    // contract.off(); remove each of `contractEvents``
    // }

    for (const listener in this.listeners) {
      const l = this.listeners[listener];
      this.removeTableListener({
        chainId: l.chainId,
        tableId: l.tableId,
      });
    }
  }

  async _ensureListening(
    listenerId: string,
    emitter: EventEmitter
  ): Promise<TablelandTables> {
    const { chainId, tableId } = await getTableIdentifier(listenerId);

    const contract = await this._getContract(chainId);
    this._attachEmitter(contract, emitter, { tableId, chainId });

    return contract;
  }

  async _getContract(chainId: number): Promise<TablelandTables> {
    if (this.contracts[chainId] != null) return this.contracts[chainId];
    if (this.config.signer == null) {
      throw new Error("signer information is required to get contract");
    }

    const { contract } = await getContractAndOverrides(
      this.config.signer,
      chainId
    );
    this.contracts[chainId] = contract;

    return contract;
  }

  _attachEmitter(
    contract: TablelandTables,
    emitter: EventEmitter,
    tableIdentifier: TableIdentifier
  ): void {
    const { tableId, chainId } = tableIdentifier;
    for (const key in contractEvents) {
      const eve = contractEvents[key];
      // TODO: might have to put the listener function in memory so we can remove it.
      contract.on(key, (...args) => {
        // TODO: revist the arguments usage and potentially clean up
        const _tableId = args[eve.tableIdIndex].toString();
        if (_tableId !== tableId) return;
        if (key !== "RunSQL") {
          emitter.emit(eve.emit, args);
        }

        const transactionHash = args[args.length - 1].transactionHash;

        const poll = async (): Promise<void> => {
          const baseUrl =
            this.config.baseUrl == null
              ? await extractBaseUrl({ signer: this.config.signer })
              : this.config.baseUrl;

          const res = await pollTransactionReceipt(
            { baseUrl },
            { transactionHash, chainId }
          );

          emitter.emit("change", res);
        };
        poll().catch((err) => {
          emitter.emit("error", { error: err, hash: transactionHash });
        });
      });
    }
  }
}
