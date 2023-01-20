import { type Signal } from "../helpers/await.js";
import { type FetchConfig, type Paths, getFetcher } from "./client/index.js";
import { hoistApiError } from "./errors.js";

/**
 * ValueOf represents only the values of a given keyed interface.
 */
export type ValueOf<T> = T[keyof T];

/**
 * TableFormat represents a object with rows and columns.
 */
export interface TableFormat<T = unknown> {
  rows: Array<ValueOf<T>>;
  columns: Array<{ name: string }>;
}

/**
 * ObjectsFormat represents an array of rows as key/value objects.
 */
export type ObjectsFormat<T> = T[];

export type BaseParams = Paths["/query"]["get"]["parameters"]["query"];
export type Format = BaseParams["format"];
export type Params<T extends Format> = BaseParams & { format?: T };

export async function getQuery<T = unknown>(
  config: FetchConfig,
  params: Params<"objects" | undefined>,
  opts?: Signal
): Promise<ObjectsFormat<T>>;
export async function getQuery<T = unknown>(
  config: FetchConfig,
  params: Params<"table">,
  opts?: Signal
): Promise<TableFormat<T>>;
export async function getQuery<T = unknown>(
  config: FetchConfig,
  params: Params<Format>,
  opts: Signal = {}
): Promise<ObjectsFormat<T> | TableFormat<T>> {
  const queryByStatement = getFetcher(config)
    .path("/query")
    .method("get")
    .create();
  const { data } = await queryByStatement(params, opts).catch(hoistApiError);
  switch (params.format) {
    case "table":
      return data as any;
    default:
      return data as any;
  }
}
