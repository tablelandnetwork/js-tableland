# @textile/tableland 中文文档

[![Lint and test](https://github.com/textileio/js-tableland/actions/workflows/lint-and-test.yml/badge.svg)](https://github.com/textileio/js-tableland/actions/workflows/lint-and-test.yml)
[![GitHub packagejson version](https://img.shields.io/github/package-json/v/textileio/js-tableland.svg)](./package.json)
[![Release](https://img.shields.io/github/release/textileio/js-tableland.svg)](https://github.com/textileio/js-tableland/releases/latest)
[![standardreadme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)

A TypeScript/JavaScript library for creating and querying Tables on the Tableland network.

用于在 Tableland 网络上创建和查询表的 TypeScript/JavaScript 库。

# 目录 Table of Contents

- [背景 Background](#背景-background)
- [安装 Install](#安装-install)
- [用法 Usage](#用法-usage)
- [API](#api)
- [反馈 Feedback](#反馈-feedback)
- [维护者 Maintainers](#维护者-maintainers)
- [贡献 Contributing](#贡献-contributing)
- [证书 License](#证书-license)

# 背景 Background

The Tableland project provides a zero-config Typescript/Javascript SDK that make it easy to interact with the Tableland network from Ethereum-based applications. The [`@textile/tableland`](https://github.com/textileio/js-tableland) SDK should feel comfortable to developers already familiar with the [`ethersjs` Javascript library](https://docs.ethers.io/). The Tableland SDK provides a small but powerful API surface that integrates nicely with existing ETH development best practices.

Tableland 项目提供了一个零配置的 Typescript/Javascript SDK，能轻松地从基于以太坊的应用与 Tableland 网络进行交互。 [`@textile/tableland`](https://github.com/textileio/js-tableland) SDK 对于已经熟悉 [`ethersjs` Javascript 库](https://docs.ethers. io/)的开发者来说应该感到非常舒适。 Tableland SDK 提供了一个小而强大的 API 界面，可以极好地与现有的 ETH 开发最佳实践集成。

Simply import the library, connect to the Tableland network, and you are ready to start creating and updating tables.

只需导入库，连接到 Tableland 网络，您就可以开始创建和更新表格了。

> Note: Interested in supporting additional chains and ecosystems? Create an Issue and let us know!
>
> 注意：有兴趣支持其他链和生态系统？创建一个问题(issue)并告诉我们！

# 安装 Install

Installation is easy using npm or yarn. An ES bundle is also available for those operating purely in a browser environnement.

使用 npm 或 yarn 很容易安装。 ES 包也可用于那些纯粹在浏览器环境中操作的人。

```bash
npm i @textile/tableland
```

> Note: Not seeing the build type you need for your project or idea? Let us know, we're happy to work with you to improve the SDK usability!
>
> 注意：看到您的项目或想法所需的构建类型？告诉我们！我们很高兴与您合作来提高 SDK 的可用性！

# 用法 Usage

Most common Tableland usage patterns will follow something like the following. In general, you'll need to connect, create, mutate, and query your tables. In that order :)

最常见的 Tableland 使用模式将遵循以下内容。通常，您需要按如下顺序来连接、创建、改写和查询您的表。

````typescript
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

# API

Full library documentation [available on GitHub](https://tablelandnetwork.github.io/js-tableland/), and
general docs, examples, and more [available on our docs site](https://docs.tableland.xyz).

# 反馈 Feedback

Reach out with feedback and ideas:

欢迎通过以下途径找到我们并反馈您的想法:

- [twitter.com/textileio](https://twitter.com/textileio)
- [Create a new issue](https://github.com/textileio/js-tableland/issues)

# 维护者 Maintainers

- [@awmuncy](https://github.com/awmuncy)
- [@carsonfarmer](https://github.com/carsonfarmer)
- [@joewagner](https://github.com/joewagner)

# 贡献 Contributing

PRs accepted.

To get started clone this repo, then do:

接受 PR。
要开始克隆此存储库，请执行以下操作：

```bash
# use the latest node and npm LTS
npm install
npm run build

# see if everything is working
npm test
````

Small note: If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

小提示：如果编辑自述文件，请遵守
[标准自述文件](https://github.com/RichardLitt/standard-readme) 规范。

# 证书 License

MIT AND Apache-2.0, © 2021 Textile.io
