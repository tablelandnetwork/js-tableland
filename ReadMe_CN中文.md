# @textile/tableland中文文档

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
  - [连接到Tableland Connecting to Tableland](#连接到tableland-connecting-to-tableland)
  - [创建表 Creating Tables](#创建表-creating-tables)
  - [列表化 Listing Tables](#列表化-listing-tables)
  - [修改表 Mutating Tables](#修改表-mutating-tables)
  - [查询表 Querying Tables](#查询表-querying-tables)
- [反馈 Feedback](#反馈-feedback)
- [示例 Examples](#示例-examples)
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

```typescript
import { connect } from "@textile/tableland";

const connection = await connect({ network: "testnet" });

let id = connection.create(
  `CREATE TABLE table (id int primary key, name text, primary key (id))`
);
let res = await connection.query(`INSERT (firstname) VALUES ('Murray' INTO ${id})`);
res = await connection.query(`SELECT * FROM ${id}`);
```

# API

[Full library documentation available on GitHub](https://textileio.github.io/js-tableland/)!

[GitHub 上提供的完整库文档](https://textileio.github.io/js-tableland/)！

## 连接到Tableland Connecting to Tableland

The `@textile/tableland` library includes functions for connecting to remote clients, creating and mutating tables, querying existing tables, and listing all user tables. These top level exports are available as individual function.

`@textile/tableland` 库包括的函数如下：连接远程客户端、创建和修改表、查询现有表以及列出所有用户表。这些顶级导出可作为单独的功能使用。

The [`connect`](https://textileio.github.io/js-tableland/modules.html#connect) function can be used to connect to a remote Tableland host, which is required to interact with the Tableland network. If information about a known Tableland validator is available, this can be specified as the host parameter in the `options` argument to the connect function.

[`connect`](https://textileio.github.io/js-tableland/modules.html#connect) 函数可用于连接与Tableland 网络交互所必需的远程 Tableland 主机。如果有关已知 Tableland 验证器的信息可用，则可以将其指定为连接函数的 `options` 参数中的主机参数。

Upon calling `connect`, the user will be prompted to sign a self-signed JSON web token. This token is used to verify ownership of the given Ethereum address, and to avoid the user having to sign subsequent Tableland transactions/method calls.

调用 `connect` 后，将提示用户签署自签名 JSON Web 代币。该代币用于验证给定以太坊地址的所有权，并避免用户后续必须签名 Tableland 交易/方法调用。

```typescript
import { connect } from "@textile/tableland";

// By default, connect uses the tableland testnet validator
const connection = await connect({ network: 'testnet', host: "http://testnet.tableland.network" });
```

## 创建表 Creating Tables

Like most relational database systems, Tableland requires the user to create tables for storing, querying, and relating data. This is done via the [`create`](https://textileio.github.io/js-tableland/modules.html#create) function. The `create` function takes a plain SQL statement string. All tables require a primary key field called `id` to be valid. Most valid SQL _constraints_ are supported, and the following data types are currently [supported](https://github.com/textileio/go-tableland/blob/main/pkg/parsing/query_validator.go):

与大多数关系型数据库系统一样，Tableland 要求用户创建用于存储、查询和关联数据的表。这是通过 [`create`](https://textileio.github.io/js-tableland/modules.html#create) 函数完成的。 `create` 函数采用纯 SQL 语句字符串。所有表都需要一个名为“id”的主键字段才能有效。支持大多数有效的 SQL _constraints_，目前[支持]([https://github.com/textileio/go-tableland/blob/main/pkg/parsing/query_validator.go）](https://github.com/textileio/go-tableland/blob/main/pkg/parsing/query_validator.go%EF%BC%89)以下数据类型：

- `int2`, `int4`, `int8`, `serial`, `bigserial`
- `text`, `uri`, `varchar`, `bpchar`
- `date`, `timestamptz`
- `bool`, `float4`, `float8`, `numeric`
- `uuid`, `json`

> Note: The above list is tentative and incomplete; the accepted types are still not well defined at the spec level.
> 
> 注：以上列表是暂定的和不完整的；可接受的类型未来会在规范级别更好定义。

```typescript
// Assumes a connection has already been established as above

const { name, id } = await connection.create(
  "CREATE TABLE table (name text, id int, primary key (id));"
);
```

Creating a table also generates at unique table identifier (uuid). The table id is globally unique and can be used to reference the table for queries and updates after it has been created.

创建表还会生成唯一的表标识符 (uuid)。表 id 是全局唯一的，可用于在创建表后引用表进行查询和更新。

Currently, tables created by a given Ethereum address are owned by that address. For the time being, this means that the user must be signed in with the address used to create the table in order to _mutate_ the table. However, any address can _read_ the table at any time.

目前，给定的以太坊地址创建的表归该地址所有。在当前阶段，这意味着用户必须使用创建表的地址登录才能对表进行*修改*。但是，任何地址都可以随时*读取*表。

> Warn: It is not advised to store sensitive or private information on the Tableland network at this time.
> 
> 警告：目前不建议在 Tableland 网络上存储敏感或私人信息。

## 列表化 Listing Tables

Once tables have been created for a given address, they can be listed via the [`list`](https://textileio.github.io/js-tableland/modules.html#list) function. This function takes no arguments and returns a list of [`TableMetadata`](https://textileio.github.io/js-tableland/interfaces/TableMetadata.html) objects, which contains table `name`, `id`, `description`, and `type`. The `type` of a table is defined by its normalized schema, whereas `name` and `description` can be specified by the caller upon creation. `id` is auto-generated by the `create` function.

一旦为给定地址创建了表，就可以通过 [`list`](https://textileio.github.io/js-tableland/modules.html#list) 函数将其列表化。此函数不接受任何参数并返回 [`TableMetadata`](https://textileio.github.io/js-tableland/interfaces/TableMetadata.html) 对象列表，其中包含表 `名字`、`id`、`描述`和`类型`。表的`类型`由其规范化模式定义，而`名字`和`描述`可以由调用者在创建时指定。 `id` 由`create` 函数自动生成。

```typescript
// Assumes a connection has already been established as above

const tables = await connection.list();
// [
//   {
//    "id": "random-uuid-string-id",
//    "type": "hash-string-type",
//    "name": "table",
//    "description": "other information"
//   }
// ]
```

An application can use the `list` function to discover a user's tables, and determine in they are relevant for the given application.

一个应用可以使用 `list` 函数来发现用户的表，并确定它们是否与给定的应用相关。

## 修改表 Mutating Tables

Now that we have a table to work with, it is easy to use vanilla SQL statements to insert new rows, update existing rows, and even delete old rows. These mutating SQL statements will eventually require network fees to be paid to network validators. For the current MVP trials, they remain free. The generic [`query`](https://textileio.github.io/js-tableland/modules.html#query) function can be used to mutate table rows. As an example, inserting new rows can be done like this:

现在我们有了一个可以使用的表，可以很容易地使用普通 SQL 语句来插入新行、更新现有行，甚至删除旧行。这些修改的 SQL 语句最终将需要向网络验证者支付网络费用。对于当前的 MVP 试用，它们仍然是免费的。通用的 [`query`](https://textileio.github.io/js-tableland/modules.html#query) 函数可用于改变表行。例如，插入新行可以这样完成：

```typescript
// Assumes a connection has already been established as above

const one = await connection.query(
  `INSERT INTO ${tableId} (id, name) VALUES (0, 'Bobby Tables');`
);

const two = await connection.query(
  `INSERT INTO ${tableId} (id, name) VALUES (0, 'Bobby Tables');`
);
```

> Note: As mentioned previously, table mutations are currently restricted to the table creator address.
> 
> 注意：如前所述，修改表（的权限）目前仅限于表创建者地址。

This inserted row can then be removed from the table state like this:

可以像这样从表状态中删除这个插入的行：

```typescript
const remove = await connection.query(`DELETE FROM ${tableId} WHERE id = 0;`);
```

> Warn: While rows can be deleted from the table state, row information will remain in the table's history for obvious reasons.
> 
> 警告：虽然可以从表状态中删除行，但出于显而易见的原因，行信息将保留在表的历史记录中。

## 查询表 Querying Tables

Finally, the moment we've all been waiting for; we are ready to query our table state! You already have all the tools required to get this done. Simply use the `query` function imported previously to query the latest table state. Currently, queries are extremely flexible in Tableland. You have most SQL query features available to craft your query, though the most common will likely be the classic `SELECT * FROM` pattern shown here:

终于，我们一直在等待的那一刻；我们准备好查询我们的表状态了！您已经拥有完成此任务所需的所有工具。只需使用之前导入的`query`函数查询最新的表状态。目前，Tableland 中的查询非常灵活。您可以使用大多数 SQL 查询功能来制作查询，最常见的可能是此处的经典 `SELECT * FROM` 语句：

```typescript
const { rows, columns } = await connection.query(`SELECT * FROM ${tableId};`);
```

The response from a read query contains a [`ReadQueryResult`](https://textileio.github.io/js-tableland/interfaces/ReadQueryResult.html) object, with properties for `columns` and `rows`. The `columns` property contains an enumerated array of column ids and their corresponding [`ColumnDescriptor`](https://textileio.github.io/js-tableland/interfaces/ColumnDescriptor.html) information. The `rows` property is an array of row-wise table data. The rows can be iterated over and used to populate UIs etc.

一个读取查询的响应包含一个 [`ReadQueryResult`](https://textileio.github.io/js-tableland/interfaces/ReadQueryResult.html) 对象，包含 `columns` 和 `rows` 的属性。 `columns` 属性包含列 id 的枚举数组及其对应的 [`ColumnDescriptor`](https://textileio.github.io/js-tableland/interfaces/ColumnDescriptor.html) 信息。 `rows` 属性是一个按行排列的表格数据数组。这些行可以被迭代并用于填充 UI 等。

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

现在您已准备好开始使用 Tableland 构建您的下一个 web3 体验！如果您想深入了解，可以查看 [此处的完整 API 文档](https://textileio.github.io/js-tableland/)。

# 反馈 Feedback

Reach out with feedback and ideas:

欢迎通过以下途径找到我们并反馈您的想法:

- [twitter.com/textileio](https://twitter.com/textileio)
- [Create a new issue](https://github.com/textileio/js-tableland/issues)

# 示例 Examples

- [To-do App](https://github.com/textileio/tableland-example-apps/) ([源代码](https://github.com/textileio/tableland-example-apps/tree/loot-extension/tableland-todo)) [To-do App](https://github.com/textileio/tableland-example-apps/) ([source](https://github.com/textileio/tableland-example-apps/tree/loot-extension/tableland-todo))
- [Loot Extension](https://github.com/textileio/tableland-example-apps/) ([源代码](https://github.com/textileio/tableland-example-apps/tree/loot-extension/loot-extension)) [Loot Extension](https://github.com/textileio/tableland-example-apps/) ([source](https://github.com/textileio/tableland-example-apps/tree/loot-extension/loot-extension))
- 更过更新，敬请期待 More on the way!

# 维护者 Maintainers

[@awmuncy](https://github.com/awmuncy)

# 贡献 Contributing

PRs accepted.

To get started clone this repo, then do:

接受PR。
要开始克隆此存储库，请执行以下操作：

```bash
# use the latest node and npm LTS
npm install
npm run build

# see if everything is working
npm test
```

Small note: If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

小提示：如果编辑自述文件，请遵守
[标准自述文件](https://github.com/RichardLitt/standard-readme) 规范。

# 证书 License

MIT AND Apache-2.0, © 2021 Textile.io
