# @tableland/sdk

[![Lint and test](https://github.com/tablelandnetwork/js-tableland/actions/workflows/lint-and-test.yml/badge.svg)](https://github.com/tablelandnetwork/js-tableland/actions/workflows/lint-and-test.yml)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/tablelandnetwork/js-tableland.svg)](./package.json)
[![Release](https://img.shields.io/github/release/tablelandnetwork/js-tableland.svg)](https://github.com/tablelandnetwork/js-tableland/releases/latest)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)

A TypeScript/JavaScript library for creating and querying Tables on the Tableland network.

# Table of Contents

- [@tableland/sdk](#tablelandsdk)
- [Table of Contents](#table-of-contents)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Feedback](#feedback)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

# Background

The Tableland project provides a zero-config Typescript/Javascript SDK that make it easy to interact with the Tableland network from Ethereum-based applications. The [`@tableland/sdk`](https://github.com/tablelandnetwork/js-tableland) SDK should feel comfortable to developers already familiar with the [`ethersjs` Javascript library](https://docs.ethers.io/). The Tableland SDK provides a small but powerful API surface that integrates nicely with existing ETH development best practices.

Simply import the library, connect to the Tableland network, and you are ready to start creating and updating tables.

> Note: Interested in supporting additional chains and ecosystems? Create an Issue and let us know!

# Install

Installation is easy using npm or yarn. An ES bundle is also available for those operating purely in a browser environnement.

```bash
npm i @tableland/sdk
```

> Note: Not seeing the build type you need for your project or idea? Let us know, we're happy to work with you to improve the SDK usability!

# Usage

Most common Tableland usage patterns will follow something like the following. In general, you'll need to connect, create, mutate, and query your tables. In that order :)

```typescript
import { connect } from "@tableland/sdk";

// Connect
const connection = await connect({ network: "testnet" });

// Create
await connection.create("id int primary key, val text");

// Write
const write = await connection.write(
  "INSERT INTO test_1 (colname) values (val1);"
);
console.log(write);
// {"hash": "blahhash"}

// Read
const query = await connection.read("SELECT * FROM test_1;");
console.log(query);
// {columns: [{name: "colname"}], rows: ["val1"]}
```

# API

Full library documentation [available on GitHub](https://tablelandnetwork.github.io/js-tableland/), and
general docs, examples, and more [available on our docs site](https://docs.tableland.xyz).

# Feedback

Reach out with feedback and ideas:

- [twitter.com/tableland\_\_](https://twitter.com/tableland__)
- [Create a new issue](https://github.com/tablelandnetwork/js-tableland/issues)

# Maintainers

- [@awmuncy](https://github.com/awmuncy)
- [@carsonfarmer](https://github.com/carsonfarmer)
- [@joewagner](https://github.com/joewagner)

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

MIT AND Apache-2.0, © 2021-2022 Tableland Network Contributors
