// Regexp to extract any placeholder types (?, ?NNN, @AAA, $AAA, or :AAA ) that are
// _not_ within quotes (", ', `) or [] "escapes". This works by having two top level
// "groups" that are or'd together. The first group is non-capturing, and catches quotes
// and escapes, and the second group is capturing, and catches all the placeholder types
export const placeholderRegExp =
  /(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\[(?:[^[\\]|\\.)*\])|(\?\d*|[:@$][a-zA-Z_]\w+)/gmu;

function isPlainObject(obj: any): obj is Record<string, BaseType> {
  if (typeof obj !== "object" || obj === null) return false;
  const proto = Object.getPrototypeOf(obj);
  return proto !== null && Object.getPrototypeOf(proto) === null;
}

function bindString(param: string, quoteEscaper = "''"): string {
  return "'" + param.replace(/'/g, quoteEscaper) + "'";
}

function bindBoolean(param: boolean): string {
  return Number(param).toString();
}

function bindNumber(param: number | bigint): string {
  return param.toString();
}

function bindDate(param: Date): string {
  return param.valueOf().toString();
}

function bindBytes(param: Uint8Array): string {
  const hex = param.reduce((t, x) => t + x.toString(16).padStart(2, "0"), "");
  return `X'${hex}'`;
}

function bindObject(param: any): string {
  return bindString(JSON.stringify(param));
}

function bindNull(_param: undefined | null): string {
  return "NULL";
}

function bindToString(param: any): string {
  return bindString(String(param));
}

interface SQL {
  toSQL: () => string;
}

function isSQL(param: any): param is SQL {
  return typeof param.toSQL === "function";
}

function bindToSQL(param: SQL): string {
  return param.toSQL();
}

function bindValue(param: BaseType): string {
  switch (typeof param) {
    case "bigint":
    case "number":
      return bindNumber(param);
    case "boolean":
      return bindBoolean(param);
    case "string":
      return bindString(param);
    case "undefined":
      return bindNull(param);
    case "object":
      if (param instanceof Date) {
        return bindDate(param);
      } else if (param instanceof Uint8Array) {
        return bindBytes(param);
      } else if (param == null) {
        return bindNull(param);
      } else if (isPlainObject(param)) {
        return bindObject(param);
      } else if (isSQL(param)) {
        return bindToSQL(param);
        /* c8 ignore next 3 */
      } else {
        return bindToString(param);
      }
    default:
      return bindToString(param);
  }
}

export type BaseType =
  | string // strings are left as is (and escaped)
  | boolean // boolean is converted to ints
  | number // numbers are left as is
  | bigint // bigints are converted to ints
  | Uint8Array // bytes arrays are converted to byte strings
  | null // null is converted to NULL
  | undefined // undefined is converted to NULL
  | Date // Date objects are converted to their valueOf
  | SQL // Anything that has a toSQL method
  | Record<string, any>; // JSON objects

export type ValuesType = BaseType | BaseType[] | Record<string, BaseType>;

export interface Parameters {
  anon: BaseType[];
  named?: Record<string, BaseType>;
}

export function getParameters(...values: ValuesType[]): Parameters {
  const initialValue: Required<Parameters> = { anon: [], named: {} };
  const flat = values.flat(Infinity);
  const result = flat.reduce(
    ({ anon, named }: Required<Parameters>, v: any) => {
      if (isPlainObject(v)) {
        return { anon, named: { ...named, ...v } };
      } else {
        return { anon: [...anon, v], named };
      }
    },
    initialValue
  );
  return result;
}

export function bindValues(sql: string, parameters?: Parameters): string {
  // https://sqlite.org/forum/forumpost/4350e973ad
  if (parameters == null) {
    return sql;
  }
  const { anon, named } = parameters;
  let bindIndex = 0;
  const seen = new Set<string | number>();
  const a = anon;
  const n = named ?? {};
  const replaced = sql.replace(
    placeholderRegExp,
    function (m: string, group: string) {
      if (group == null) {
        return m;
      }
      if (group === "?") {
        return bindValue(a[bindIndex++]);
      } else if (/\?\d*/.test(group)) {
        const index = parseInt(group.slice(1)) - 1;
        if (index >= bindIndex) {
          bindIndex = index + 1;
        }
        return bindValue(a[index]);
      } else if (/[:@$][a-zA-Z_]\w+/g.test(group)) {
        const key = group.slice(1);
        seen.add(key);
        return bindValue(n[key]);
        /* c8 ignore next 3 */
      } else {
        return m;
      }
    }
  );
  const expectedParams = bindIndex + seen.size;
  const receivedParams = a.length + Object.keys(n).length;
  if (expectedParams !== receivedParams) {
    throw new Error(
      `parameter mismatch: received (${receivedParams}), expected ${expectedParams}`
    );
  }
  return replaced;
}
