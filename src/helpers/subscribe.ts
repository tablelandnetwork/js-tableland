import { EventEmitter } from "events";
import asyncGenFromEmit from "@async-generators/from-emitter";
import { type TablelandTables } from "@tableland/evm";
import { pollTransactionReceipt } from "../validator/receipt.js";
import {
  getTableIdentifier,
  getContractAndOverrides,
  type TableIdentifier,
} from "../registry/contract.js";
import { extractBaseUrl, type Config } from "../helpers/index.js";

// @ts-expect-error Seems like this package isn't setup to work with modern esm + ts
const fromEmitter = asyncGenFromEmit.default;

type ContractEventTableIdMap = Record<
  string,
  {
    tableIdIndex: number;
    emit: string;
  }
>;

type ContractMap = Record<number, TablelandTables>;

interface ContractEventListener {
  eventName: string;
  eventListener: (...args: any[]) => void;
}

type ListenerMap = Record<
  // The key is the listenerId, which is _{chainId}_{tableId}
  string,
  {
    chainId: number;
    tableId: string;
    emitter: EventEmitter;
    contractListener: {
      chainId: number;
      listeners: ContractEventListener[];
    };
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
    const contractEventListeners = await this._ensureListening(
      listenerId,
      emitter
    );
    const contractListener = {
      chainId: tableIdentifier.chainId,
      listeners: contractEventListeners,
    };

    this.listeners[listenerId] = {
      ...tableIdentifier,
      emitter,
      contractListener,
    };

    return emitter;
  }

  /**
   * A simple wrapper around `addTableListener` that returns an async iterable
   * which can be used with the for await ... of pattern.
   * @param tableName The full name of table that you want to listen for
   * changes to.
   */
  async addTableIterator<T>(tableName: string): Promise<AsyncIterable<T>> {
    const emmiter = await this.addTableListener(tableName);
    return fromEmitter(emmiter, {
      onNext: "change",
      onError: "error",
      onDone: "close",
    });
  }

  /**
   * Remove a listener (or iterator) based on chain and tableId
   * @param params A TableIdentifier Object. Must have `chainId` and `tableId` keys.
   */
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

  // stop listening to the contract and remove all listeners
  removeAllTableListeners(): void {
    // Need to remove the contract listener first because removing
    // the table listener will delete the listeners object
    for (const chainId in this.contracts) {
      const contract = this.contracts[chainId];
      for (const listenerId in this.listeners) {
        const listenerObj = this.listeners[listenerId];
        const listenerObjChainId = listenerObj.chainId.toString();

        if (listenerObjChainId === chainId) {
          // the chainId of the contract and the Listener Object are the same
          // then we want to dig into the Listener Object and for each event that
          // the contract is listening to we call contract.off(eventName, eventListenerFunctionInstance)
          for (
            let i = 0;
            i < listenerObj.contractListener.listeners.length;
            i++
          ) {
            const listenerEventFunc = listenerObj.contractListener.listeners[i];
            contract.off(
              listenerEventFunc.eventName,
              listenerEventFunc.eventListener
            );
          }
        }
      }
    }

    // Now that the contract listeners are gone we can remove
    // the emitter listeners and delete the entries
    for (const listener in this.listeners) {
      const l = this.listeners[listener];
      this.removeTableListener({
        chainId: l.chainId,
        tableId: l.tableId,
      });
    }
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

  async _ensureListening(
    listenerId: string,
    emitter: EventEmitter
  ): Promise<ContractEventListener[]> {
    const { chainId, tableId } = await getTableIdentifier(listenerId);

    const contract = await this._getContract(chainId);
    return this._attachEmitter(contract, emitter, { tableId, chainId });
  }

  _attachEmitter(
    contract: TablelandTables,
    emitter: EventEmitter,
    tableIdentifier: TableIdentifier
  ): ContractEventListener[] {
    const { tableId, chainId } = tableIdentifier;
    const listenerEventFunctions = [];

    for (const key in contractEvents) {
      const eve = contractEvents[key];
      // put the listener function in memory so we can remove it if needed
      const listener = (...args: any[]): void => {
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
      };

      contract.on(key, listener);

      listenerEventFunctions.push({
        eventName: key,
        eventListener: listener,
      });
    }

    return listenerEventFunctions;
  }
}
