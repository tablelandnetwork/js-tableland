import { ApiError } from "./client/index.js";

export function hoistApiError(err: unknown): never {
  if (err instanceof ApiError) {
    err.message = err.data?.message ?? err.statusText;
  }
  throw err;
}
