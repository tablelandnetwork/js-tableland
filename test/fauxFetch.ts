import { myTableResponseBody } from "../test/constants";

export const FetchMyTables = async () => {
  return {
    body: JSON.stringify(myTableResponseBody),
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
        structure_hash: "ef7be01282ea97380e4d3bbcba6774cbc7242c46ee51b7e611f1efdfa3623e53"
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
      message: "TEST ERROR: invalid sql near 123"
    }
  });
};

export const FetchSelectQuerySuccess = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    result: {columns: ['colname'], rows: ['val1']}
  });
};

export const FetchInsertQuerySuccess = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    result: {
      data: null
    }
  });
};

export const FetchUpdateQuerySuccess = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    result: {
      data: null
    }
  });
};

export const FetchRunQueryError = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    error: {
      code: -32000,
      message: "TEST ERROR: tableland validator mock error."
    }
  });
};

export const FetchHashTableSuccess = async () => {
  return {
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: {
        structure_hash: "ef7be01282ea97380e4d3bbcba6774cbc7242c46ee51b7e611f1efdfa3623e53"
      },
    }),
  };
};

export const FetchHashTableError = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    error: {
      code: -32000,
      message: "TEST ERROR: invalid sql near 123"
    }
  });
};
