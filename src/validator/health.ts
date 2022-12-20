import { type Signal } from "../helpers/await.js";
import { type FetchConfig, getFetcher } from "./client/index.js";

export async function getHealth(
  config: FetchConfig,
  opts: Signal = {}
): Promise<boolean> {
  const health = getFetcher(config).path("/health").method("get").create();
  const { ok } = await health({}, opts);
  return ok;
}
