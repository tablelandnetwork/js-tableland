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
      result: {
        name: "Hello_115",
      },
    }),
  };
};

export const FetchQuerySuccess = async () => {
  return {
    body: [],
  };
};
