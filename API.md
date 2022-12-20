# @tableland/client API

> These docs are borrowed extensively from https://developers.cloudflare.com/d1/platform/client-api/

## Prepared and static statements

As part of our `Database` API, both static and prepared statements are supported. In the current implementation, the prepared statements are prepared locally, and executed remotely (on-chain). In the future, the statements will be prepared remotely.

Below is an example of a prepared statement:

```js
const stmt = db.prepare("SELECT * FROM users WHERE name = ?1").bind("Joe");
```

However, if you still choose to use a static statement you can use the following as an example:

```js
const stmt = db.prepare('SELECT * FROM users WHERE name = "John Doe"');
```

## Parameter binding

We follow the [SQLite convention](https://www.sqlite.org/lang_expr.html#varparam) for prepared statements parameter binding. Currently we support Ordered (?NNNN) and Anonymous (?) parameters, as well as all three forms of named parameters.

| Syntax  | Type      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `?NNN`  | Ordered   | A question mark followed by a number NNN holds a spot for the NNN-th parameter.                                                                                                                                                                                                                                                                                                                                                                    |
| `?`     | Anonymous | A question mark that is not followed by a number creates a parameter with a number one greater than the largest parameter number already assigned. This parameter format is provided for compatibility with other database engines. But because it is easy to miscount the question marks, the use of this parameter format is discouraged. Programmers are encouraged to use one of the symbolic formats below or the `?NNN` format above instead |
| `:AAA`  | Named     | A colon followed by an identifier name holds a spot for a named parameter with the name :AAAA. To avoid confusion, it is best to avoid mixing named and numbered parameters.                                                                                                                                                                                                                                                                       |
| `@AAAA` | Named     | An "at" sign works exactly like a colon, except that the name of the parameter created is @AAAA.                                                                                                                                                                                                                                                                                                                                                   |
| `$AAAA` | Named     | A dollar-sign followed by an identifier name also holds a spot for a named parameter with the name $AAAA.                                                                                                                                                                                                                                                                                                                                          |

To bind a parameter we use the method: `stmt.bind()`

### Order and anonymous examples:

```js
const stmt = db.prepare("SELECT * FROM users WHERE name = ?").bind("John Doe");
```

```js
const stmt = db
  .prepare("SELECT * FROM users WHERE name = ? AND age = ?")
  .bind("John Doe", 41);
```

```js
const stmt = db
  .prepare("SELECT * FROM users WHERE name = ?2 AND age = ?1")
  .bind(41, "John Doe");
```

In addition to the basic features offered by `D1Ddatabase`, our `Database` API supports a number of advanced `bind` features, such as named parameters, and complex data types that are converted to basic types on the fly.

```js
const stmt = db
  .prepare(
    "INSERT INTO people VALUES (@name, ?, :name, ?, '?', ?4, ?3, ?, $blah);"
  )
  .bind(
    45,
    { name: "Hen'ry", blah: "😬" },
    [54, true, Uint8Array.from([1, 2, 3])],
    null
  );
```

## Type conversion

Type conversion from Javascript inputs to Tableland inputs is as follows:

| Javascript      | D1        |
| --------------- | --------- |
| null            | `NULL`    |
| undefined       | `NULL`    |
| Number[^1]      | `INTEGER` |
| String          | `TEXT`    |
| ArrayBuffer     | `BLOB`    |
| Booleans[^2]    | `INTEGER` |
| Date            | `INTEGER` |
| Object/JSON[^3] | `TEXT`    |

Additionally, any object that implements a `toSQL` method can also be used.

`[^1]`: Tableland supports 64-bit signed INTEGERs internally, and we mostly support [BigInts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) on the client side. These values will be converted to INTEGERs. Note that Javascript integer's are safe up to [Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER).

`[^2]`: Booleans will be turned into integers where 1 is `TRUE` and 0 is `FALSE`.

`[^3]`: [Plain old objects](https://masteringjs.io/tutorials/fundamentals/pojo) that can be converted to JSON strings will be converted to JSON and inserted as TEXT.

## Return object

The methods `stmt.run()`, `stmt.all()` and `db.batch()` return an object that contains the results (if applicable), the success status, and a meta object with the internal duration of the operation in milliseconds, and any transaction information available.

```typescript
{
  results: [], // may be empty
  success: boolean, // true if the operation was successful
  error?: string,
  meta: {
    duration: number, // duration of operation in milliseconds
    txn?: {
        chainId: number,
        tableId: string,
        transactionHash: string,
        blockNumber: number,
        error?: string,
        name?: string
        wait(): Promise<{ ... }>
    }
  }
}
```

Example:

```typescript
const { duration } = (
  await db
    .prepare("INSERT INTO users (name, age) VALUES (?1, ?2)")
    .bind("John", 42)
    .run()
).meta;

console.log(duration); // 0.172
```

## Query statement methods

- The `Database` API supports the following query statement methods:
- `await stmt.first( [column] )`
- `await stmt.all( [column] )`
- `await stmt.raw()`
- `await stmt.run()`
- `await db.exec()`

### await stmt.first([column])

Returns the first row of the results. This does not return metadata like the other methods. Instead it returns the object directly.

Get a specific column from the first row:

```typescript
const stmt = db.prepare("SELECT COUNT(*) AS total FROM users");
const total = await stmt.first("total");
console.log(total); // 50
```

Get all the the columns from the first row:

```typescript
const stmt = db.prepare("SELECT COUNT(*) AS total FROM users");
const values = await stmt.first();
console.log(values); // { total: 50 }
```

If the query returns no rows, then first() will return `null`.

If the query returns rows, but `column` does not exist, then first() will throw an exception.

### await stmt.all( [column] )

Returns all rows and metadata.

```js
const stmt = db.prepare("SELECT name, age FROM users LIMIT 3");
const { results } = await stmt.all();
console.log(results);
/*
[
  {
     name: "John",
     age: 42,
  },
   {
     name: "Anthony",
     age: 37,
  },
    {
     name: "Dave",
     age: 29,
  },
 ]
*/
```

### await stmt.raw()

Same as stmt.all(), but returns an array of rows instead of objects.

```js
const stmt = db.prepare("SELECT name, age FROM users LIMIT 3");
const raw = await stmt.raw();
console.log(raw);
/*
[
  [ "John", 42 ],
  [ "Anthony", 37 ],
  [ "Dave", 29 ],
]
*/
console.log(raw.map((row) => row.join(",")).join("\n"));
/*
John,42
Anthony,37
Dave,29
*/
```

### await stmt.run()

Runs the query/queries, but returns no results. Instead, run() returns the metrics only.
Useful for write operations like UPDATE, DELETE or INSERT.

```typescript
const info = await db
  .prepare("INSERT INTO users (name, age) VALUES (?1, ?2)")
  .bind("John", 42)
  .run();

console.log(info);
/*
{
  success: true
  meta: {
    duration: 366.55073300004005,
    txn: {
        tableId: '5',
        transactionHash: '0x050b60bfec948c82f81528d60b3189cc00bd967b3ffcf5ac253a6a103bd2c3b7',
        blockNumber: 7710,
        chainId: 31337,
        wait: [AsyncFunction: wait],
        name: 'test_run_31337_5'
    }
    }
}
*/
```

On Tableland, mutating transactions such as INSERTs, DELETEs, and UPDATEs produce a two-phase transaction. Firstly, the transaction is sent to the registry contract, and awaited. The returned `txn` information also contains a `wait` method than can be used to await finalization on the Tableland network. This method will also throw an exception if any runtime errors occur.

```typescript
const { transactionHash } = await info.txn.wait();
console.log(transactionHash);
/*
0x050b60bfec948c82f81528d60b3189cc00bd967b3ffcf5ac253a6a103bd2c3b7
*/
```

The `Database` may also be run in `autoWait` mode, such that each mutating call will not resolve until it has finalized on the Tableland network. This is useful when working with D1 compatible libraries, or to avoid issues with nonce-reuse etc.

Additionally, all async method calls take an optional `AbortSignal` object, which may be used to cancel or otherwise abort an inflight query. Note that this will only abort queries (including wait status), not the actual mutation transaction itself.

```typescript
const controller = new AbortController();
const signal = controller.signal;

const stmt = db.prepare("SELECT name, age FROM users WHERE age < ?1");

setTimeout(() => controller.abort(), 10);
const young = await stmt.bind(20).all({ signal });
/*
Error: The operation was aborted.
*/
```

### await db.exec()

Executes one or more queries directly without prepared statements or parameters binding. This method can have poorer performance (prepared statements can be reused in some cases) and, more importantly, is less safe. Only use this method for maintenance and one-shot tasks (example: migration jobs). The input can be one or multiple queries separated by the standard `;`.
If an error occurs, an exception is thrown with the query and error messages (see below for Errors).

Currently, the entire string of statements is submitted as a single transaction. In the future, more "intelligent" transaction planning, splitting, and batching may be used.

```typescript
const migration = await fetch("/migration.sql");
const out = await db.exec(migration.text());
console.log(out);
/*
{
  count: 5,
  duration: 76,
  ...
}
*/
```

## Reusing prepared statements

Prepared statements can be reused with new bindings:

```js
const stmt = db.prepare("SELECT name, age FROM users WHERE age < ?1");
const young = await stmt.bind(20).all();
console.log(young);
/*
{
  results: [...],
  success: true
  meta: {
    duration: 31,
  }
}
*/
const old = await stmt.bind(80).all();
console.log(old);
/*
{
  results: [...],
  success: true
  meta: {
    duration: 29,
  }
}
*/
```

## Batch statements

Batching sends multiple SQL statements inside a single call to the network. This can have a huge performance impact as it reduces latency from network round trips to Tableland. Our implementation guarantees that each statement in the list will execute and commit, sequentially, non-concurrently.

Batched statements are similar to [SQL transactions](https://www.sqlite.org/lang_transaction.html). If a statement in the sequence fails, then an error is returned for that specific statement, and it aborts or rolls back the entire sequence.

### db.batch()

To send batch statements, we feed batch() with a list of prepared statements and get back the results.

```js
await db.batch([
  db.prepare("UPDATE users SET name = ?1 WHERE id = ?2").bind("John", 17),
  db.prepare("UPDATE users SET age = ?1 WHERE id = ?2").bind(35, 19),
]);
```

You can construct batches reusing the same prepared statement. When sending readonly queries, these are proccessed currently, and a set of results are returned.

```js
const stmt = db.prepare("SELECT * FROM users WHERE name = ?1");

const rows = await db.batch([stmt.bind("John"), stmt.bind("Anthony")]);

console.log(rows[0].results);
/*
[
  {
     name: "John Clemente",
     age: 42,
  },
   {
     name: "John Davis",
     age: 37,
  },
 ]
*/
console.log(rows[1].results);
/*
[
  {
     name: "Anthony Hopkins",
     age: 66,
  },
 ]
*/
```

## PRAGMA statements

The `Database` API supports the following [SQLite PRAGMA](https://www.sqlite.org/pragma.html)-style statements. Note that these are not true PRAGMA statements, and are instead processed client-side and may leverage on-chain transactions and/or queries.

| PRAGMA       | Description                                                                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `table_list` | Returns information about the tables and views in the schema, one table per row of output                                                                                                                 |
| `table_info` | This pragma returns one row for each column in the named table. Columns in the result set include the column name, data type, whether or not the column can be NULL, and the default value for the column |     |

Other PRAGMAs are disabled because of Tableland implementation specifics.

```js
const r = await db.batch([
  db.prepare("PRAGMA table_list"),
  db.prepare("PRAGMA table_info(my_table)"),
]);
console.log(r);
/*
[
  {
    "results": [
      {
      "schema": "main",
      "name": "my_table",
      "type": "table",
      "ncol": 3,
      "wr": 0,
      "strict": 0
      },
      ...
    ]
  },
  {
    "results": [
      {
        "cid": 0,
        "name": "cid",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 1
      },
      ...
    ]
  }
]

*/
```

## Errors

The `stmt.` and `db.` methods will throw a [Error object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) whenever an error occurs.

`Database` Errors use [cause property](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause) for details.

```js
new Error("D1_ERROR", { cause: new Error("Error detail") });
```

To capture exceptions:

```js
try {
    await db.exec("INSERTZ INTO my_table (name, employees) VALUES ()");
} catch (e: any) {
    console.log({
        message: e.message,
        cause: e.cause.message,
    });
}
/*
{
  "message": "EXEC_ERROR",
  "cause": "Error in line 1: INSERTZ INTO my_table (name, employees) VALUES (): sql error: near \"INSERTZ\": syntax error in INSERTZ INTO my_table (name, employees) VALUES () at offset 0"
}
*/
```
