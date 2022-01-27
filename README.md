# @textile/tableland

[![Lint and test](https://github.com/textileio/js-tableland/actions/workflows/lint-and-test.yml/badge.svg)](https://github.com/textileio/js-tableland/actions/workflows/lint-and-test.yml)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/textileio/js-tableland.svg)](./package.json)
[![Release](https://img.shields.io/github/release/textileio/js-tableland.svg)](https://github.com/textileio/js-tableland/releases/latest)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)

A TypeScript/JavaScript library for creating and querying Tables on the Tableland network.

# Table of Contents

- [@textile/tableland](#textiletableland)
- [Table of Contents](#table-of-contents)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Feedback](#feedback)
- [Examples](#examples)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

# Background

The Tableland project provides a zero-config Typescript/Javascript SDK that make it easy to interact with the Tableland network from Ethereum-based applications. The [`@textile/tableland`](https://github.com/textileio/js-tableland) SDK should feel comfortable to developers already familiar with the [`ethersjs` Javascript library](https://docs.ethers.io/). The Tableland SDK provides a small but powerful API surface that integrates nicely with existing ETH development best practices.

Simply import the library, connect to the Tableland network, and you are ready to start creating and updating tables.

> Note: Interested in supporting additional chains and ecosystems? Create an Issue and let us know!

# Install

Installation is easy using npm or yarn. An ES bundle is also available for those operating purely in a browser environnement.

```bash
npm i @textile/tableland
```

> Note: Not seeing the build type you need for your project or idea? Let us know, we're happy to work with you to improve the SDK usability!

# Usage

Most common Tableland usage patterns will follow something like the following. In general, you'll need to connect, create, mutate, and query your tables. In that order :)

```typescript
import { connect, createTable, runQuery, myTables } from "@textile/tableland";

await connect({ host: "http://testnet.tableland.network" });

let id = createTable(
  `CREATE TABLE table (name text, id int, primary key (id))`
);
let res = await runQuery(`INSERT (firstname) VALUES ('Murray' INTO ${id})`);
res = await runQuery(`SELECT * FROM ${id}`);
```

# API

[Full library documentation available on GitHub](https://textileio.github.io/js-tableland/)!

## Connecting to Tableland

The `@textile/tableland` library includes functions for connecting to remote clients, creating and mutating tables, querying existing tables, and listing all user tables. These top level exports are available as individual function.

The [`connect`](https://textileio.github.io/js-tableland/modules.html#connect) function can be used to connect to a remote Tableland host, which is required to interact with the Tableland network. If information about a known Tableland validator is available, this can be specified as the host parameter in the `options` argument to the connect function.

Upon calling `connect`, the user will be prompted to sign a self-signed JSON web token. This token is used to verify ownership of the given Ethereum address, and to avoid the user having to sign subsequent Tableland transactions/method calls.

```typescript
import { connect } from "@textile/tableland";

// By default, connect uses the tableland testnet validator
const conn = await connect({ host: "http://testnet.tableland.network" });
```

## Creating Tables

Like most relational database systems, Tableland requires the user to create tables for storing, querying, and relating data. This is done via the [`createTable`](https://textileio.github.io/js-tableland/modules.html#createTable) function. The `createTable` function takes a plain SQL statement string. All tables require a primary key field called `id` to be valid. Most valid SQL _constraints_ are supported, and the following data types are currently [supported](https://github.com/textileio/go-tableland/blob/main/pkg/parsing/query_validator.go):

- `int2`, `int4`, `int8`, `serial`, `bigserial`
- `text`, `uri`, `varchar`, `bpchar`
- `date`, `timestamptz`
- `bool`, `float4`, `float8`, `numeric`
- `uuid`, `json`

> Note: The above list is tentative and incomplete; the accepted types are still not well defined at the spec level.

```typescript
import { createTable } from "@textile/tableland";
// Assumes a connection has already been established as above

const tableId = await createTable(
  "CREATE TABLE table (name text, id int, primary key (id));"
);
```

Creating a table also generates at unique table identifier (uuid). The table id is globally unique and can be used to reference the table for queries and updates after it has been created.

Currently, tables created by a given Ethereum address are owned by that address. For the time being, this means that the user must be signed in with the address used to create the table in order to _mutate_ the table. However, any address can _read_ the table at any time.

> Warn: It is not advised to store sensitive or private information on the Tableland network at this time.

## Listing Tables

Once tables have been created for a given address, they can be listed via the [`myTables`](https://textileio.github.io/js-tableland/modules.html#myTables) function. This function takes no arguments and returns a list of [`TableMetadata`](https://textileio.github.io/js-tableland/interfaces/TableMetadata.html) objects, which contains table `name`, `id`, `description`, and `type`. The `type` of a table is defined by its normalized schema, whereas `name` and `description` can be specified by the caller upon creation. `id` is auto-generated by the `createTable` function.

```typescript
import { myTables } from "@textile/tableland";
// Assumes a connection has already been established as above

const tables = await myTables();
// [
//   {
//    "id": "random-uuid-string-id",
//    "type": "hash-string-type",
//    "name": "table",
//    "description": "other information"
//   }
// ]
```

An application can use the `myTables` function to discover a user's tables, and determine in they are relevant for the given application.

## Mutating Tables

Now that we have a table to work with, it is easy to use vanilla SQL statements to insert new rows, update existing rows, and even delete old rows. These mutating SQL statements will eventually require network fees to be paid to network validators. For the current MVP trials, they remain free. The generic [`runQuery`](https://textileio.github.io/js-tableland/modules.html#runQuery) function can be used to mutate table rows. As an example, inserting new rows can be done like this:

```typescript
import { runQuery } from "@textile/tableland";
// Assumes a connection has already been established as above

const one = await runQuery(
  `INSERT INTO ${tableId} (id, name) VALUES (0, 'Bobby Tables');`
);

const two = await runQuery(
  `INSERT INTO ${tableId} (id, name) VALUES (0, 'Bobby Tables');`
);
```

> Note: As mentioned previously, table mutations are currently restricted to the table creator address.

This inserted row can then be removed from the table state like this:

```typescript
const remove = await runQuery(`DELETE FROM ${tableId} WHERE id = 0;`);
```

> Warn: While rows can be deleted from the table state, row information will remain in the table's history for obvious reasons.

## Querying Tables

Finally, the moment we've all been waiting for; we are ready to query our table state! You already have all the tools required to get this done. Simply use the `runQuery` function imported previously to query the latest table state. Currently, queries are extremely flexible in Tableland. You have most SQL query features available to craft your query, though the most common will likely be the classic `SELECT * FROM` pattern shown here:

```typescript
const { rows, columns } = await runQuery(`SELECT * FROM ${tableId};`);
```

The response from a read query contains a [`ReadQueryResult`](https://textileio.github.io/js-tableland/interfaces/ReadQueryResult.html) object, with properties for `columns` and `rows`. The `columns` property contains an enumerated array of column ids and their corresponding [`ColumnDescriptor`](https://textileio.github.io/js-tableland/interfaces/ColumnDescriptor.html) information. The `rows` property is an array of row-wise table data. The rows can be iterated over and used to populate UIs etc.

```typescript
for (const [rowId, row] of Object.entries(rows)) {
  console.log(`row: ${rowId}`);
  for (const [colId, data] of Object.entries(row)) {
    const { name } = columns[colId];
    console.log(`  ${name}: ${data}`);
  }
}
```

And now you're ready to start building your next web3 experience with Tableland! If you want to dive deeper, you can check out the [full API documentation here](https://textileio.github.io/js-tableland/).

# Feedback

Reach out with feedback and ideas:

- [twitter.com/textileio](https://twitter.com/textileio)
- [Create a new issue](https://github.com/textileio/js-tableland/issues)

# Examples

- [To-do App](https://github.com/textileio/tableland-example-apps/) ([source](https://github.com/textileio/tableland-example-apps/tree/loot-extension/tableland-todo))
- [Loot Extension](https://github.com/textileio/tableland-example-apps/) ([source](https://github.com/textileio/tableland-example-apps/tree/loot-extension/loot-extension))
- More on the way!

# Maintainers

[@awmuncy](https://github.com/awmuncy)

# Contributing

PRs accepted.

To get started clone this repo, then do:

```bash
# use the latest node and npm LTS
npm install
npm run build

# see if everything is working
npm test
```

Small note: If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

# License

MIT AND Apache-2.0, © 2021 Textile.io
