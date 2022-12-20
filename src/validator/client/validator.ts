/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */


export interface paths {
  "/health": {
    /**
     * Get health status 
     * @description Returns OK if the validator considers itself healthy.
     */
    get: operations["health"];
  };
  "/version": {
    /**
     * Get version information 
     * @description Returns version information about the validator daemon.
     */
    get: operations["version"];
  };
  "/query": {
    /**
     * Query the network 
     * @description Returns the results of a SQL read query against the Tabeland network
     */
    get: operations["queryByStatement"];
  };
  "/receipt/{chainId}/{transactionHash}": {
    /**
     * Get transaction status 
     * @description Returns the status of a given transaction receipt by hash
     */
    get: operations["receiptByTransactionHash"];
  };
  "/tables/{chainId}/{tableId}": {
    /**
     * Get table information 
     * @description Returns information about a single table, including schema information
     */
    get: operations["getTableById"];
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    readonly Table: {
      /** @example healthbot_5_1 */
      readonly name?: string;
      /** @example https://testnet.tableland.network/tables/healthbot_5_1 */
      readonly external_url?: string;
      /** @example https://render.tableland.xyz/anim/?chain=1&id=1 */
      readonly animation_url?: string;
      /** @example https://render.tableland.xyz/healthbot_5_1 */
      readonly image?: string;
      /**
       * @example {
       *   "display_type": "date",
       *   "trait_type": "created",
       *   "value": 1657113720
       * }
       */
      readonly attributes?: readonly ({
          /** @description The display type for marketplaces */
          readonly display_type?: string;
          /** @description The trait type for marketplaces */
          readonly trait_type?: string;
          /** @description The value of the property */
          readonly value?: string | number | number | boolean | Record<string, never>;
        })[];
      readonly schema?: components["schemas"]["Schema"];
    };
    readonly TransactionReceipt: {
      /** @example 1 */
      readonly table_id?: string;
      /** @example 0x400508d7cc035b14cc53f64393a8dafcc55f66ad8f9b44d626744157337e2098 */
      readonly transaction_hash?: string;
      /**
       * Format: int64 
       * @example 1
       */
      readonly block_number?: number;
      /**
       * Format: int32 
       * @example 80001
       */
      readonly chain_id?: number;
      /** @example The query statement is invalid */
      readonly error?: string;
      /**
       * Format: int32 
       * @example 1
       */
      readonly error_event_idx?: number;
    };
    readonly Schema: {
      readonly columns?: readonly (components["schemas"]["Column"])[];
      /**
       * @example [
       *   "PRIMARY KEY (id)"
       * ]
       */
      readonly table_constraints?: readonly (string)[];
    };
    readonly Column: {
      /** @example id */
      readonly name?: string;
      /** @example integer */
      readonly type?: string;
      /**
       * @example [
       *   "NOT NULL",
       *   "PRIMARY KEY",
       *   "UNIQUE"
       * ]
       */
      readonly constraints?: readonly (string)[];
    };
    readonly VersionInfo: {
      /**
       * Format: int32 
       * @example 0
       */
      readonly version?: number;
      /** @example 79688910d4689dcc0991a0d8eb9d988200586d8f */
      readonly git_commit?: string;
      /** @example foo/experimentalfeature */
      readonly git_branch?: string;
      /** @example dirty */
      readonly git_state?: string;
      /** @example v1.2.3_dirty */
      readonly git_summary?: string;
      /** @example 2022-11-29T16:28:04Z */
      readonly build_date?: string;
      /** @example v1.0.1 */
      readonly binary_version?: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type external = Record<string, never>;

export interface operations {

  health: {
    /**
     * Get health status 
     * @description Returns OK if the validator considers itself healthy.
     */
    responses: {
      /** @description The validator is healthy. */
      200: never;
    };
  };
  version: {
    /**
     * Get version information 
     * @description Returns version information about the validator daemon.
     */
    responses: {
      /** @description successful operation */
      200: {
        content: {
          readonly "application/json": components["schemas"]["VersionInfo"];
        };
      };
    };
  };
  queryByStatement: {
    /**
     * Query the network 
     * @description Returns the results of a SQL read query against the Tabeland network
     */
    parameters: {
        /**
         * @description The SQL read query statement 
         * @example select * from healthbot_80001_1
         */
        /**
         * @description The requested response format:
         *  * `objects` - Returns the query results as a JSON array of JSON objects.
         *  * `table` - Return the query results as a JSON object with columns and rows properties.
         */
        /** @description Whether to extract the JSON object from the single property of the surrounding JSON object. */
        /** @description Whether to unwrap the returned JSON objects from their surrounding array. */
      readonly query: {
        statement: string;
        format?: "objects" | "table";
        extract?: boolean;
        unwrap?: boolean;
      };
    };
    responses: {
      /** @description Successful operation */
      200: {
        content: {
          readonly "application/json": Record<string, never>;
        };
      };
      /** @description Invalid query/statement value */
      400: never;
      /** @description Row Not Found */
      404: never;
      /** @description Too Many Requests */
      429: never;
    };
  };
  receiptByTransactionHash: {
    /**
     * Get transaction status 
     * @description Returns the status of a given transaction receipt by hash
     */
    parameters: {
        /**
         * @description The parent chain to target 
         * @example 80001
         */
        /**
         * @description The transaction hash to request 
         * @example 0x400508d7cc035b14cc53f64393a8dafcc55f66ad8f9b44d626744157337e2098
         */
      readonly path: {
        chainId: number;
        transactionHash: string;
      };
    };
    responses: {
      /** @description successful operation */
      200: {
        content: {
          readonly "application/json": components["schemas"]["TransactionReceipt"];
        };
      };
      /** @description Invalid chain identifier or transaction hash format */
      400: never;
      /** @description No transaction receipt found with the provided hash */
      404: never;
      /** @description Too Many Requests */
      429: never;
    };
  };
  getTableById: {
    /**
     * Get table information 
     * @description Returns information about a single table, including schema information
     */
    parameters: {
        /**
         * @description The parent chain to target 
         * @example 80001
         */
        /**
         * @description Table identifier 
         * @example 1
         */
      readonly path: {
        chainId: number;
        tableId: string;
      };
    };
    responses: {
      /** @description successful operation */
      200: {
        content: {
          readonly "application/json": components["schemas"]["Table"];
        };
      };
      /** @description Invalid chain or table identifier */
      400: never;
      /** @description Table Not Found */
      404: never;
      /** @description Too Many Requests */
      429: never;
      /** @description Internal Server Error */
      500: never;
    };
  };
}
