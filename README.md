# @textile/tableland


[![Lint and test](https://github.com/textileio/js-tableland/actions/workflows/lint-and-test.yml/badge.svg)](https://github.com/textileio/js-tableland/actions/workflows/lint-and-test.yml)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/textileio/storage-js.svg)](./package.json)
[![Release](https://img.shields.io/github/release/textileio/storage-js.svg)](https://github.com/textileio/storage-js/releases/latest)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)



# Table of Contents

- [@textile/tableland](#textiletableland)
- [Table of Contents](#table-of-contents)
- [Background](#background)
- [Install](#install)
  - [Usage](#usage)
  - [Contributing](#contributing)
  - [Tests with Jest](#tests-with-jest)
  - [Documentation, published with CI](#documentation-published-with-ci)
  - [Feedback](#feedback)
  - [Examples](#examples)
- [Maintainers](#maintainers)
- [Contributing](#contributing-1)
- [License](#license)

# Background

Textile's `@textile/tableland` provides zero-config Typescript/JavaScript SDKs that make it easy to user the Tableland network from any Blockchain-based dApp. `@textile/tableland` should feel comfortable to developers already familiat with the [Ethers](https://docs.ethers.io/) Javascript library. 

Simply import the library, connect your wallet, and you are ready to start making queries to Tables on the Tableland, and minting your own. Interested in supporting additional chains and ecosystems? Create an Issue and let us know!

# Install

```bash
npm i @textile/tableland
```

## Usage



```typescript
import { connect, createTable, runQuery } from '@textile/tableland';

await connect('http://tableland.com'); 

let tableTokenId = createTable("CREATE ..."); 
  
  runQuery("INSERT (firstname) VALUES ('Murray' INTO MyTable)", table.token_id);  
}

```


## Contributing

```bash
git clone https://github.com/textileio/js-tableland.git

cd js-tableland

# Install dependencies
npm install

# Now you can run various commands:
npm run build
npm run tsbuild
npm run build:dev
npm run build:watch
npm lint
npm test
```

* Take a look at all the scripts in [`package.json`](https://github.com/metachris/typescript-boilerplate/blob/master/package.json)
* For publishing to npm, use `npm publish`



You can generate a full clean build with `npm build-all` (which uses both `tsc` and `esbuild`).

* `package.json` includes `scripts` for various esbuild commands: [see here](https://github.com/metachris/typescript-boilerplate/blob/master/package.json#L23)
* `esbuild` has a `--global-name=xyz` flag, to store the exports from the entry point in a global variable. See also the [esbuild "Global name" docs](https://esbuild.github.io/api/#global-name).
* Read more about the esbuild setup [here](https://www.metachris.com/2021/04/starting-a-typescript-project-in-2021/#esbuild).
* esbuild for the browser uses the IIFE (immediately-invoked function expression) format, which executes the bundled code on load (see also https://github.com/evanw/esbuild/issues/29)


## Tests with Jest

You can write [Jest tests](https://jestjs.io/docs/getting-started) [like this](https://github.com/metachris/typescript-boilerplate/blob/master/src/main.test.ts):

```typescript
import { greet } from './main'

test('the data is peanut butter', () => {
  expect(1).toBe(1)
});

test('greeting', () => {
  expect(greet('Foo')).toBe('Hello Foo')
});
```

Run the tests with `npm test`, no separate compile step is necessary.

* See also the [Jest documentation](https://jestjs.io/docs/getting-started).
* The tests can be automatically run in CI (GitHub Actions, GitLab CI): [`.github/workflows/lint-and-test.yml`](https://github.com/textileio/js-tableland/blob/master/.github/workflows/lint-and-test.yml), [`.gitlab-ci.yml`](https://github.com/textileio/js-tableland/blob/master/.gitlab-ci.yml)


## Documentation, published with CI

You can auto-generate API documentation from the TyoeScript source files using [TypeDoc](https://typedoc.org/guides/doccomments/). The generated documentation can be published to GitHub / GitLab pages through the CI.

Generate the documentation, using `src/main.ts` as entrypoint (configured in package.json):

```bash
npm docs
```

The resulting HTML is saved in `docs/`.

You can publish the documentation through CI:
* [GitHub pages](https://pages.github.com/): See [`.github/workflows/deploy-gh-pages.yml`](https://github.com/metachris/typescript-boilerplate/blob/master/.github/workflows/deploy-gh-pages.yml)


## Feedback

Reach out with feedback and ideas:

* [twitter.com/textileio](https://twitter.com/textileio)
* [Create a new issue](https://github.com/textileio/js-tableland/issues)

## Examples

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