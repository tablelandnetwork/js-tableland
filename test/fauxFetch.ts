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

export const FetchCreateTableOnTablelandSuccess = async () => {
  return {
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: {
        name: "Hello_115",
      },
    }),
  };
};

export const FetchRunQuerySuccess = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    result: {columns: ['colname'], rows: ['val1']}
  });
};

export const FetchRunQueryError = async () => {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    error: {
      code: -32000,
      message: "TEST ERROR: table name has wrong format"
    }
  });
};
