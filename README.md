# @tableland/sdk

[![Review](https://github.com/tablelandnetwork/js-tableland/actions/workflows/review.yml/badge.svg)](https://github.com/tablelandnetwork/js-tableland/actions/workflows/review.yml)
[![Test](https://github.com/tablelandnetwork/js-tableland/actions/workflows/test.yml/badge.svg)](https://github.com/tablelandnetwork/js-tableland/actions/workflows/test.yml)
[![Publish](https://github.com/tablelandnetwork/js-tableland/actions/workflows/publish.yml/badge.svg)](https://github.com/tablelandnetwork/js-tableland/actions/workflows/publish.yml)
[![License](https://img.shields.io/github/license/tablelandnetwork/js-tableland.svg)](./LICENSE)
[![Version](https://img.shields.io/github/package-json/v/tablelandnetwork/js-tableland.svg)](./package.json)
[![Release](https://img.shields.io/github/release/tablelandnetwork/js-tableland.svg)](https://github.com/tablelandnetwork/js-tableland/releases/latest)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)

> A D1Database client and helpers for the Tableland network

# Table of Contents

- [@tableland/sdk](#tablelandsdk)
- [Table of Contents](#table-of-contents)
- [Background](#background)
- [Usage](#usage)
- [Install](#install)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

# Background

The `@tableland/sdk` library provides a minimal client and SDK that implements the D1Database interface on top of the Tableland network. It can be used as a drop-in replacement to work with many community-created D1 tools and libraries. It also comes with a set of helper utilities for working with Tableland.

# Usage

See the [API documentation](./API.md) for details.

```ts
import { Database } from "@tableland/sdk";
import { providers } from "ethers";

// A Web3Provider wraps a standard Web3 provider, which is
// what MetaMask injects as window.ethereum into each page
const provider = new providers.Web3Provider(window.ethereum);

// MetaMask requires requesting permission to connect users accounts
await provider.send("eth_requestAccounts", []);

// The MetaMask plugin also allows signing transactions to
// pay for gas when calling smart contracts like the @tableland
// registry...
const signer = provider.getSigner();
const db = new Database({ signer });

// Prepared statements allow users to reuse query logic by binding values
const stmt = db.prepare("SELECT name, age FROM users_80001_1 LIMIT ?").bind(3);
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

Full library documentation [available on GitHub](https://tablelandnetwork.github.io/js-tableland/), and
general docs, examples, and more [available on our docs site](https://docs.tableland.xyz).

# Install

You can install via npm/yarn:

```bash
npm i @tableland/sdk
# yarn add @tableland/sdk
```

Or directly via GitHub:

```bash
npm i tablelandnetwork/js-tableland
```

# Development

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

# Contributing

PRs accepted.

Small note: If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

# License

MIT AND Apache-2.0, © 2021-2022 Tableland Network Contributors
