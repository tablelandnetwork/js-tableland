import { myTableResponseBody, noTableResponseBody } from "../test/constants";

export const FetchMyTables = async () => {
  return {
    body: JSON.stringify(myTableResponseBody),
  };
};

export const FetchNoTables = async () => {
  return {
    body: JSON.stringify(noTableResponseBody),
  };
};

export const FetchAuthorizedListSuccess = async () => {
  return {
    status: 200,
  };
};

export const FetchCreateDryRunSuccess = async () => {
  return {
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: {
        name: "hello_1",
      },
    }),
  };
};

export const FetchCreateTableOnTablelandSuccess = async () => {
  return {
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: {
        name: "hello_115",
        structure_hash:
          "ef7be01282ea97380e4d3bbcba6774cbc7242c46ee51b7e611f1efdfa3623e53",
      },
    }),
  };
};

export const FetchCreateDryRunError = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    error: {
      code: -32000,
      message: "TEST ERROR: invalid sql near 123",
    },
  });
};

export const FetchValidateWriteQuery = async () => {
  return {
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: {
        tableId: 1,
      },
    }),
  };
};

export const FetchDirectRunSQLSuccess = async () => {
  return {
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: {
        success: true,
      },
    }),
  };
};

export const FetchSelectQuerySuccess = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    result: { data: { columns: [{ name: "colname" }], rows: [["val1"]] } },
  });
};

export const FetchInsertQuerySuccess = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    result: {
      tx: { hash: "testhashinsertresponse" },
    },
  });
};

export const FetchSetControllerSuccess = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    result: {
      tx: { hash: "testhashsetcontrollerresponse" },
    },
  });
};

export const FetchUpdateQuerySuccess = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    result: {
      tx: { hash: "testhashinsertresponse" },
    },
  });
};

export const FetchRunQueryError = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    error: {
      code: -32000,
      message: "TEST ERROR: tableland validator mock error.",
    },
  });
};

export const FetchHashTableSuccess = async () => {
  return {
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: {
        structure_hash:
          "ef7be01282ea97380e4d3bbcba6774cbc7242c46ee51b7e611f1efdfa3623e53",
      },
    }),
  };
};

export const FetchHashTableError = async () => {
  return {
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: -32000,
        message: "TEST ERROR: invalid sql near 123",
      },
    })
  };
};

export const FetchReceiptExists = async () => {
  return {
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: {
        receipt: {
          chainId: 5,
          txnHash: "0xc3e7d1e81b59556f414a5f5c23760eb61b4bfaa18150d924d7d3b334941dbecd",
          blockNumber: 1000,
          tableId: '2',
        }
      }
    })
  };
};

export const FetchReceiptNone = async () => {
  return {
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: {},
    }),
  };
};
