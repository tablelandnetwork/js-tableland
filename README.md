# @tableland/sdk

[![Review](https://github.com/tablelandnetwork/js-tableland/actions/workflows/review.yml/badge.svg)](https://github.com/tablelandnetwork/js-tableland/actions/workflows/review.yml)
[![Test](https://github.com/tablelandnetwork/js-tableland/actions/workflows/test.yml/badge.svg)](https://github.com/tablelandnetwork/js-tableland/actions/workflows/test.yml)
[![Publish](https://github.com/tablelandnetwork/js-tableland/actions/workflows/publish.yml/badge.svg)](https://github.com/tablelandnetwork/js-tableland/actions/workflows/publish.yml)
[![License](https://img.shields.io/github/license/tablelandnetwork/js-tableland.svg)](./LICENSE)
[![Version](https://img.shields.io/github/package-json/v/tablelandnetwork/js-tableland.svg)](./package.json)
[![Release](https://img.shields.io/github/release/tablelandnetwork/js-tableland.svg)](https://github.com/tablelandnetwork/js-tableland/releases/latest)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)

> Tableland JavaScript SDK—the essential tool for building web3 apps with Tableland databases.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
  - [Database](#database)
  - [Validator](#validator)
  - [Registry](#registry)
  - [Build Tools](#build-tools)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Background

The `@tableland/sdk` library provides an easy-to-use interface for integrating Tableland databases into your web3 applications, unlocking decentralized data-driven development with SQL queries (creates, writes, reads) and access control.

## Install

You can install via npm/yarn:

```bash
npm i @tableland/sdk
# yarn add @tableland/sdk
```

Or directly via GitHub:

```bash
npm i tablelandnetwork/js-tableland
```

## Usage

Full library documentation is [generated on GitHub](https://tablelandnetwork.github.io/js-tableland/), and
general docs, examples, and more are [available on our docs site](https://docs.tableland.xyz/sdk/core/).

### Database

A `Database` is used to create, write, and read data. To connect to a `Database`, you first must import and instantiate it. There are two key considerations:

- If you are _only reading_ data, you **do not** need a signer, which is an abstraction of an EVM account and used for sending on-chain transactions—database reads are off-chain.
- If you are _creating or writing to_ tables, you **do** need a signer since database mutations require an EVM account to send transactions.

If you need to set up a signer, libraries like [`ethers`](https://docs.ethers.org/v5/) help provide a way to create one by leveraging a connection with a `provider`. From there, all database creates, writes, and reads go through a single `prepare` method.

#### Connecting

As noted, creating a table instantiates a `Database` and must connect to it with a signer; this is also true for any table writes. The `ethers` library is used in the example below to create a signer, which comes as part of the `@tableland/sdk` but can also be installed separately.

```ts
import { Database } from "@tableland/sdk";
import { providers } from "ethers";

// Connect to a chain provider, such as a browser wallet
const provider = new providers.Web3Provider(window.ethereum);
// Request permission to connect to a users accounts
await provider.send("eth_requestAccounts", []);

// Create a signer from the connected browser wallet
const signer = provider.getSigner();
// Create a database connection; the signer passes the connected
// chain and is used for signing create table transactions
const db = new Database({ signer });
```

For certain applications, it's possible that developers will want to manage connections from a local wallet and not a browser wallet. You'll want to create a provider connection using a custom provider URL or the default ethers provider for the [specified chain](https://docs.tableland.xyz/sdk/#chains).

```ts
import { Database } from "@tableland/sdk";
import { Wallet, getDefaultProvider } from "ethers";

// Define your private key (but replace with your own)
const privateKey = PRIVATE_KEY; // It's recommended to use `dotenv` and a place this in a `.env` file
// Create the wallet (an extension of a signer)
const wallet = new Wallet(privateKey);
// Connect to a provider (e.g., Alchemy, etc.)—you should pass your own
// provider URL to `getDefaultProvider()` (avoid the throttled default)
// For example: `https://eth-mainnet.alchemyapi.io/v2/${YOUR_API_KEY}`
const provider = getDefaultProvider("homestead"); // Defaults to Ethereum mainnet
// Create a signer by attaching the wallet to the provider
const signer = wallet.connect(provider);
// Connect to the database
const db = new Database({ signer });
```

For read-only connections, a signer is not required. This `Database` connection can be used to make multichain queries across any of the chains in which Tableland is deployed to. Note that in the signer-connected `Database` above, read queries are still possible.

```ts
import { Database } from "@tableland/sdk";

// Create a database connection; since there is no signer,
// table reads are possible but creates/writes are not
const db = new Database();
```

If no `signer` is provided and you try to create or write to tables, the `Database` will default to prompting a browser wallet connection.

#### Create, write, & read

To create a table, you pass a `CREATE TABLE` statement to the `prepare` method and then execute it.

```ts
// This is the table's `prefix`--a custom table value prefixed as part of the table's name
const prefix = "my_sdk_table";

const { meta: create } = await db
  .prepare(`CREATE TABLE ${prefix} (id integer primary key, val text);`)
  .run();

// The table's `name` is in the format `{prefix}_{chainId}_{tableId}`
const { name } = create.txn; // e.g., my_sdk_table_80001_311
```

Once the table is created, you can then insert, update, and/or delete data with prepared statements. Parameter binding is a useful feature such that you can pass parameters in `bind` that replace the `?` placeholders in this example.

```ts
// Insert a row into the table with an `INSERT INTO` statement
const { meta: insert } = await db
  .prepare(`INSERT INTO ${name} (id, val) VALUES (?, ?);`)
  .bind(0, "Bobby Tables")
  .run();

// Wait for transaction finality
await insert.txn.wait();
```

Notice the `insert.txn.wait()` usage above. Table creates and writes are on-chain actions, so a transaction must be "finalized" before the data is made available via a `SELECT` query. Once the data is settled, it can be read.

```ts
// Perform a read query, requesting `all` rows from the table
const { results } = await db.prepare(`SELECT * FROM ${name};`).all();
```

### Validator

Aside from the core `Database`, developers can also choose to connect directly to a Tableland `Validator` node. Connecting to a validator is useful when you'd like to directly access other table or validator information as exposed by a [Tableland Gateway API](https://docs.tableland.xyz/gateway-api/).

A validator is instantiated using a `Database`. The `Database` does not need a signer, but it _does_ need a `baseUrl` to be defined, which helps to explicitly define which chain is being used. The exported `helpers` has a useful `getBaseUrl` method that forms the `baseUrl` based on a passed chain ID number.

For example, assuming you've already established a provider, you can connect to a `Validator` and retrieve node health info.

```ts
import { Database, Validator, helpers } from "@tableland/sdk";

// Get the chain ID from the ethers `provider`
const { chainId } = await provider.getNetwork(); // Or, statically define, e.g., `const chainId = 1`
// Passing the `signer` is optional here, but `baseUrl` is required for the `Validator`
const db = new Database({
  baseUrl: helpers.getBaseUrl(chainId),
});
// Instantiate a validator using an existing Database instance
const validator = new Validator(db.config);
console.log(validator);
//  {
//    config: {
//      baseUrl: "https://tableland.network/api/v1"
//    }
//  }
const isHealthy = await validator.health();
console.log(isHealthy);
// true
```

### Registry

The SDK is in-part a JavaScript abstraction of the core Tableland registry smart contract. Developers can choose to interact directly with the `Registry` API for table creates and writes, if desired. It also offers a couple of additional features, such as listing all tables owned by an address or transferring table ownership altogether.

Since these are on-chain interactions, a signer is needed to interact with the `Registry` on a specific chain.

```ts
import { Database, Registry, helpers } from "@tableland/sdk";

// Creating the signer is required—use one of the examples above
const db = new Database({ signer });
// Instantiate the registry using an existing Database instance
const registry = await new Registry(db.config); // Must have a signer
// Get all tables owned by an address—defaults to the signer's address
const tables = await registry.listTables();
console.log(tables);
//  [
//    {
//      tableId: '2',
//      chainId: 1
//    }
//  ]

// Transfer a table to another address
const to = "0x1234..."; // A `0x` EVM address in which you're transfer table ownership to
const tx = await reg.safeTransferFrom({
  to,
  tableName: "{name}_{prefix}_{chainId}", // Replace with your table name
});
// Wait for the transaction to finalize, transferring table ownership
await tx.wait();
```

### Build Tools

The Tableland SDK uses an optimized WASM build of our SQL parser under the hood. Unfortunately, some build systems such as [Vite](https://vitejs.dev) require an adjustment to their configuration to support this feature. To temporarily work around this issue, simply add `@tableland/sqlparser` to the `excluded` list under `optimizeDeps` in your `vite.config.ts` file:

```ts
// ...
optimizeDeps: {
  exclude: ["@tableland/sqlparser"];
}
// ...
```

See [our own Rigs project](https://github.com/tablelandnetwork/rigs/blob/main/animation_url/vite.config.ts#L17) for an example of using this in production.

## Development

Get started by cloning, installing, building, and testing the project:

```shell
git clone git@github.com:tablelandnetwork/js-tableland.git
cd js-tableland
npm install
npm run build
npm test
```

To run tests in a few of the common browser environments we are using Playwright. Once your code changes are finished you can run the brower tests by doing:

- `cd test/browser/server`
- `npm install`
- `cd ../../`
- `npm run test:browser`

## Contributing

PRs accepted.

Small note: If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT AND Apache-2.0, © 2021-2022 Tableland Network Contributors
