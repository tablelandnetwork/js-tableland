/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { deepStrictEqual, strictEqual } from "assert";
import { describe, test } from "mocha";
import { getAccounts } from "@tableland/local";
import {
  D1Orm,
  DataTypes,
  Model,
  GenerateQuery,
  QueryType,
  type Infer,
} from "d1-orm";
import { getDefaultProvider, overrideDefaults } from "../src/helpers/index.js";
import { Database } from "../src/index.js";

overrideDefaults("localhost", {
  contractAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
});

describe("d1-orm", function () {
  // Note that we're using the second account here
  const [, wallet] = getAccounts();
  const provider = getDefaultProvider("http://127.0.0.1:8545");
  const signer = wallet.connect(provider);
  const db = new Database({ signer });
  const orm = new D1Orm(db);

  // We'll define our core model up here and use it in tests below
  const users = new Model(
    {
      D1Orm: orm,
      tableName: "users",
      primaryKeys: "id",
      uniqueKeys: [["email"]],
    },
    {
      id: {
        type: DataTypes.INTEGER,
        notNull: true,
      },
      name: {
        type: DataTypes.STRING,
        notNull: true,
        // See https://github.com/Interactions-as-a-Service/d1-orm/issues/60
        // defaultValue: "John Doe",
      },
      email: {
        type: DataTypes.STRING,
      },
    }
  );
  type User = Infer<typeof users>;

  this.beforeAll(async function () {
    this.timeout("10s");

    const create = await users.CreateTable({
      strategy: "default",
    });
    await create.meta.txn.wait();

    // TODO: Find a nicer way to deal with this...
    (users.tableName as any) = create.meta.txn.name;
  });

  test("where a basic model is used to create data", async function () {
    await users.InsertOne({
      name: "Bobby Tables",
      email: "bobby-tab@gmail.com",
    });

    const [result] = await users.InsertMany([
      {
        name: "Bobby Tables",
        email: "bob-tables@gmail.com",
      },
      {
        name: "Jane Tables",
        email: "janet@gmail.com",
      },
    ]);

    await result.meta.txn.wait();

    const { results } = await users.All({
      where: { name: "Bobby Tables" },
      limit: 1,
      offset: 0,
      orderBy: ["id"],
    });

    deepStrictEqual(results, [
      {
        name: "Bobby Tables",
        id: 1,
        email: "bobby-tab@gmail.com",
      },
    ]);
  });

  test("basic query building works well to then query the data", async function () {
    const { query, bindings } = GenerateQuery<User>(
      QueryType.SELECT,
      users.tableName, // Could also come from the above meta.txn objects
      {
        where: {
          name: "Bobby Tables",
        }, // this uses the type from above to enforce it to properties which exist on the table
        limit: 1, // we only want the first user
        offset: 1, // skip the first user named 'Bobby Tables' when performing this query

        // Using orderBy is a special case, so there's a few possible syntaxes for it
        orderBy: { column: "id", descending: true }, // ORDER BY id DESC NULLS LAST
      }
    );

    // Using the database directly
    const stmt = db.prepare(query).bind(bindings);
    const { results } = await stmt.all();
    deepStrictEqual(results, [
      {
        name: "Bobby Tables",
        id: 1,
        email: "bobby-tab@gmail.com",
      },
    ]);
  });

  test("where upserts are easier when using an orm", async function () {
    const user: User = {
      id: 1,
      name: "John Doe",
      email: "john-doe@gmail.com",
    };
    const { query, bindings } = GenerateQuery<User>(
      QueryType.UPSERT,
      users.tableName, // Could also come from the above meta.txn objects
      {
        data: user,
        upsertOnlyUpdateData: {
          name: user.name,
          email: user.email,
        },
        where: {
          id: user.id,
        },
      },
      "id"
    );
    // {
    //    query: "INSERT INTO users (id, name, email) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = ?, email = ? WHERE id = ?",
    //    bindings: [1, "John Doe", "john-doe@gmail.com", "John Doe", "john-doe@gmail.com", 1]
    // }

    // Using the database directly
    const stmt = db.prepare(query).bind(bindings);
    const { meta } = await stmt.run();
    const receipt = await (meta.txn as any).wait();
    strictEqual(receipt?.error, undefined);

    const results = await db
      .prepare(`SELECT * FROM ${users.tableName} WHERE id=?`)
      .bind(user.id)
      .first<User>();
    deepStrictEqual(results, user);
  });
});
