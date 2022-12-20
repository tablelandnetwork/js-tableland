import camelize, { type Camelize } from "camelize-ts";
import { type Signal } from "../helpers/await.js";
import { type PartialRequired } from "../helpers/utils.js";
import { hoistApiError } from "./errors.js";
import {
  type Components,
  type FetchConfig,
  type Paths,
  getFetcher,
} from "./client/index.js";

export type Params =
  Paths["/tables/{chainId}/{tableId}"]["get"]["parameters"]["path"];

type Column = Components["schemas"]["Column"];
type BaseSchema = Components["schemas"]["Schema"];
interface Schema extends BaseSchema {
  readonly columns: Array<PartialRequired<Column, "constraints">>;
}

type Response = Components["schemas"]["Table"];
interface AssertedResponse
  extends PartialRequired<Response, "animation_url" | "attributes"> {
  attributes?: Array<Record<string, any>>;
  schema: Schema;
}

export type Table = Camelize<AssertedResponse>;

function assertResponse(obj: Response): obj is AssertedResponse {
  return (
    obj.external_url != null &&
    obj.image != null &&
    obj.name != null &&
    obj.schema != null &&
    obj.schema.columns != null
  );
}

function transformResponse(obj: Response): Table {
  if (assertResponse(obj)) {
    return camelize(obj);
  }
  /* c8 ignore next 2 */
  throw new Error("malformed table repsonse");
}

export async function getTable(
  config: FetchConfig,
  params: Params,
  opts: Signal = {}
): Promise<Table> {
  const getTableById = getFetcher(config)
    .path("/tables/{chainId}/{tableId}")
    .method("get")
    .create();
  const { data } = await getTableById(params, opts).catch(hoistApiError);
  const transformed = transformResponse(data);
  return transformed;
}
