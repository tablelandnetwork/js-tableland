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

Textile's `@textile/tableland` provides zero-config Typescript/JavaScript SDKs that make it easy to user the Tableland network from any Blockchain-based dApp. `@textile/tableland` should feel comfortable to developers already familiat with the [Ethers](https://docs.ethers.io/) Javascript library. 

Simply import the library, connect your wallet, and you are ready to start making queries to Tables on the Tableland, and minting your own. Interested in supporting additional chains and ecosystems? Create an Issue and let us know!

# Install

```bash
npm i @textile/tableland
```

# Usage


```typescript
import { connect, createTable, runQuery } from '@textile/tableland';

await connect('http://tableland.com'); 

let tableTokenId = createTable("CREATE ..."); 
  
  runQuery("INSERT (firstname) VALUES ('Murray' INTO MyTable)", table.token_id);  
}

```

You can generate a full clean build with `npm build-all` (which uses both `tsc` and `esbuild`).


# Feedback

Reach out with feedback and ideas:

* [twitter.com/textileio](https://twitter.com/textileio)
* [Create a new issue](https://github.com/textileio/js-tableland/issues)

# Examples

- [To-do App](https://github.com/textileio/tableland-example-apps/) ([source](https://github.com/textileio/tableland-example-apps/tree/loot-extension/tableland-todo)
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