export type PartialRequired<T, S extends keyof T> = Omit<Required<T>, S> &
  Partial<Pick<T, S>>;

export function getRange(size: number, startAt: number = 0): readonly number[] {
  return [...Array(size).keys()].map((i) => i + startAt);
}

export const getDelay = async (ms: number): Promise<void> =>
  await new Promise((resolve) => setTimeout(resolve, ms));
