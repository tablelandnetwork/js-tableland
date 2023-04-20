# @tableland/sdk API

> These docs are borrowed extensively from the Cloudflare D1 documentation of which Tableland is fully compatible with: https://developers.cloudflare.com/d1/platform/client-api/

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

## Additional APIs

For folks that want more fine-grained access to Tableland, such as getting, setting, and locking controller contracts, or listing a user’s tables, etc you might find that these operations don’t fit within the `Database` abstraction provided above. This is where the two additional core APIs come into play.

For direct access to API calls on the validator(s), you can leverage the `Validator` class:

```typescript
import { Validator } from "@tableland/sdk";

// Pull info from an existing Database instance
const obj = new Validator(db.config); // Must have baseUrl defined

const isHealthy = await obj.health();
console.log(isHealthy); // true

const { name, schema } = await obj.getTableById({
  chainId: 80001,
  tableId: "1",
});
console.log(name); // healthbot_31337_1
console.log(schema);
/*
{
	columns: [
		{
			name: "counter",
			type: "integer",
		},
	],
}
*/
```

Similarly, for more direct access to the Tableland Tables smart contract methods, you can leverage the `Registry` class:

```typescript
import { Registry, helpers } from "@tableland/sdk";
// There are a whole lot more functions and tools in helpers to explore
const { getContractReceipt } = helpers;

// Pull info from an existing Database instance
const reg = await new Registry(db.config); // Must have signer defined

const tx = await reg.createTable({
  chainId: 31337,
  statement: "create table test_ownership_31337 (id int, name text)",
});
// Helper function to extract table name event information
const receipt = await getContractReceipt(tx);

// List my tables
const results = await reg.listTables(/* default to connected wallet address */);

// Transfer the above table to my friend!
const tx = await reg.safeTransferFrom({
  to: friendAddress,
  tableName: receipt, // Also accepts name as string
});
// Tableland adopts this "wait" style pattern from ethers!
await tx.wait();
```

## Typescript

The `Database` API and all related classes and modules are written in Typescript, and provide a generic interface to fully-typed queries and responses (if you want). Currently, if you do _not_ provide types, it will default to `unknown`. This is probably _not_ what you want, so passing in `any` is fine, but you can do a whole lot more if you provide a concrete type.

Types can be provided on the Database constructor, on the Statement constructor (prepare), or callers can override them on any of the query/execution APIs directly (i.e., `run`, `all`, `first`, or `raw`).

```typescript
// Define a custom type
type User {
  name: string;
  age: number;
}

const user = {
  name: "John Clemente",
  age: 42,
}

type UserInferred = typeof user

const db = new Database<User>({ ... })
const stmt = db.prepare("SELECT * FROM users WHERE name = ?1");

// From now on, query results will be fully typed
const { results } = await stmt.bind("John").all<UserInferred>();
// Assuming you have the above type correctly defined,
// you should get something like this:
console.log(results[0].name) // Fully typed
/*
"John Clemente"
*/
```

Note that the generic type system for `Database` is relatively sophisticated, so it should correctly determine the response shape of `raw` versus `all`, etc. Building on the previous example:

```typescript
// Callers do not need to define these types,
// they are provided for illustrative purposes
type ValueOf<T> = T[keyof T];
type RawUser = ValueOf<User>;

// Results will be typed with the correct structure
const results = await stmt.bind("John").raw<User>();

// The results here are basically defined as
// type Array<RawUser>
console.log(results[0][0]);
/*
"John Clemente"
*/
```

## Integrations

With `Database` interface, we have made third party library integrations our top priority. For example, if you are writing Tableland interactions inside a React app that uses something like [`wagmi`](https://wagmi.sh/), the above examples might start off something like the following (inside your components/hooks):

```typescript
import { useSigner } from "wagmi";
import { Database } from "@tableland/sdk";

function App() {
  const { data: signer } = useSigner()

	const db = Database.fromSigner(signer);
	...
}
```

Additionally, thanks to our support for [Cloudflare’s `D1Database` interface](https://developers.cloudflare.com/d1/platform/client-api/), support for an ORM is possible via [`d1-orm`](https://docs.interactions.rest/d1-orm/). See our tests for a quick example of creating, updating, and querying a table via a Model object.

Additional integrations provide some client-side safety for injecting table names, query parameters, and more via prepared statement syntax. While you don’t need [`@databases/sql`](https://www.atdatabases.org/) to leverage prepared statements with the Tableland SDK, it does provide some nice methods for working with raw SQL strings, so we leverage it here:

```typescript
import sql, { FormatConfig } from "@databases/sql";
import { escapeSQLiteIdentifier } from "@databases/escape-identifier";
import { Database } from "@tableland/sdk";

// See https://www.atdatabases.org/docs/sqlite
const sqliteFormat: FormatConfig = {
  escapeIdentifier: (str) => escapeSQLiteIdentifier(str),
  formatValue: (value) => ({ placeholder: "?", value }),
};

// First, we'll test out using sql identifiers
const primaryKey = sql.ident("id");
const query = sql`CREATE TABLE test_sql (${primaryKey} integer primary key, counter integer, info text);`;
const { text, values } = query.format(sqliteFormat);
const { meta } = await db.prepare(text).bind(values).run();
const { name } = await meta.txn.wait();
console.log(`Created table ${name}`);
```

What about all those fancy `ethersjs` tools out there? We can leverage those in Tableland quite nicely, as we have pretty direct control over the `Signer` interface that drives our database mutations. Here's how you might instantiate a `Database` within a NodeJS app:

```typescript
import { NonceManager } from "@ethersproject/experimental";
import { Database, helpers } from "@tableland/sdk";
import { Wallet } from "ethers";
const { getDefaultProvider } = helpers;

// Or maybe you want to use the dotenv package
const privateKey = process.env.PRIVATE_KEY;

const wallet = new Wallet(privateKey);
const provider = getDefaultProvider("http://127.0.0.1:8545");
// const signer = wallet.connect(provider);
const baseSigner = wallet.connect(provider);
// Also demonstrates the nonce manager usage
const signer = new NonceManager(baseSigner);
const db = new Database({ signer });

// No need to await individual transations (due to nonce manager)!
```

## Errors

The `stmt.` and `db.` methods will throw a [Error object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) whenever an error occurs.

`Database` Errors use [cause property](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause) for details.

```js
new Error("ERROR: ...", { cause: new Error("Error detail") });
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
  "message": "EXEC_ERROR: ...",
  "cause": "Error in line 1: INSERTZ INTO my_table (name, employees) VALUES (): sql error: near \"INSERTZ\": syntax error in INSERTZ INTO my_table (name, employees) VALUES () at offset 0"
}
*/
```
