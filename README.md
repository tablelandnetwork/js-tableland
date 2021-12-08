# @textile/js-storage

[![Build and test status](https://github.com/textileio/js-tableland/workflows/Lint%20and%20test/badge.svg)](https://github.com/textileio/js-tableland/actions?query=workflow%3A%22Build+and+test%22)



## Getting Started

```
npm install --save @textile/js-tablelandjs
```

In your project

```JavaScript
import { connect, createTable, runQuery } from '@textile/js-tableland'

async function useTableland() {
  let deets = await connect('http://tableland.com'); // this is your validator

  let table = createTable("CREATE ..."); // You can optionally pass in a UUID
  
  runQuery("INSERT (firstname) VALUES ('Murray' INTO MyTable", table.token_id);  
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



You can generate a full clean build with `yarn build-all` (which uses both `tsc` and `esbuild`).

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
