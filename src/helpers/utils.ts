export type PartialRequired<T, S extends keyof T> = Omit<Required<T>, S> &
  Partial<Pick<T, S>>;

export function getRange(size: number, startAt: number = 0): readonly number[] {
  return [...Array(size).keys()].map((i) => i + startAt);
}

export const getDelay = async (ms: number): Promise<void> =>
  await new Promise((resolve) => setTimeout(resolve, ms));

// Vendored from https://github.com/kbrabrand/camelize-ts/blob/main/src/index.ts
// Copyright (c) 2021 Kristoffer Brabrand

type CamelCase<S extends string> =
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
    : S;

export type Camelize<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends Array<infer U>
    ? U extends Record<string, unknown> | undefined
      ? Array<Camelize<U>>
      : T[K]
    : T[K] extends Record<string, unknown> | undefined
    ? Camelize<T[K]>
    : T[K];
};

export function camelCase(str: string): string {
  return str.replace(/[_.-](\w|$)/g, function (_, x) {
    return x.toUpperCase();
  });
}

function walk(obj: any): any {
  if (obj == null || typeof obj !== "object") return obj;
  if (obj instanceof Date || obj instanceof RegExp) return obj;
  if (Array.isArray(obj)) return obj.map(walk);

  return Object.keys(obj).reduce<any>((res, key) => {
    const camel = camelCase(key);
    res[camel] = walk(obj[key]);
    return res;
  }, {});
}

export function camelize<T>(obj: T): T extends string ? string : Camelize<T> {
  return typeof obj === "string" ? camelCase(obj) : walk(obj);
}
