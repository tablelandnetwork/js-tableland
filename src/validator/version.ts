import { camelize, type Camelize } from "../helpers/utils.js";
import { type Signal } from "../helpers/await.js";
import {
  getFetcher,
  type Components,
  type FetchConfig,
} from "./client/index.js";
import { hoistApiError } from "./errors.js";

type Response = Components["schemas"]["VersionInfo"];
type AssertedResponse = Required<Response>;
export type Version = Camelize<AssertedResponse>;

function assertResponse(obj: Response): obj is AssertedResponse {
  return Object.values(obj).every((v) => v != null);
}

function transformResponse(obj: Response): Version {
  if (assertResponse(obj)) {
    return camelize(obj);
  }
  /* c8 ignore next 2 */
  throw new Error("malformed version repsonse");
}

export async function getVersion(
  config: FetchConfig,
  opts: Signal = {}
): Promise<Version> {
  const version = getFetcher(config).path("/version").method("get").create();
  const { data } = await version({}, opts).catch(hoistApiError);
  const transformed = transformResponse(data);
  return transformed;
}
