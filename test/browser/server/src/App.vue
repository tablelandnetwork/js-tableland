<script lang="ts">

import { Database, helpers } from "../../../../dist/esm/index.js";
import { getDefaultProvider, Wallet } from "ethers";

const wallet = new Wallet(
  "c526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa",
  getDefaultProvider("http://127.0.0.1:8545")
);
const db = new Database({
  signer: wallet,
  baseUrl: helpers.getBaseUrl("local-tableland"),
  autoWait: true,
});

export default {
  data: function () {
    return {
      tablename: "",
      message: ""
    };
  },

  methods: {
    create: async function () {
      const { meta } = await db
        .prepare("CREATE TABLE browser_table (k text, v text, num integer);")
        .run();

      this.$data.tablename = meta.txn.name;
      this.$data.message = "table was created";
    },
    doDelete: async function () {
      const { meta } = await db
        .prepare(`DELETE FROM ${this.tablename} WHERE num = 2`)
        .run();

      this.$data.tablename = meta.txn.name;
      this.$data.message = "data was deleted";
    },
    insert: async function () {
      const { meta } = await db
        .prepare(`INSERT INTO ${this.tablename} (k, v, num) VALUES ('name', 'number', 1);`)
        .run();

      this.$data.message = "data was inserted";
    },
    read: async function () {
      const { results } = await db
        .prepare(`SELECT * FROM ${this.tablename};`)
        .run();

      this.$data.message = `table was read, data is: ${JSON.stringify(results)}`;
    },
    update: async function () {
      const { meta } = await db
        .prepare(`UPDATE ${this.tablename} SET num = 2 WHERE num = 1;`)
        .run();

      this.$data.message = "table was updated";
    }
  }
}

</script>

<template>
  <div data-testid="status">
    {{ message }}
  </div>

  <main>
    <button name="create" @click="create">create</button>
    <button name="dodelete" @click="dodelete">dodelete</button>
    <button name="insert" @click="insert">insert</button>
    <button name="read" @click="read">read</button>
    <button name="update" @click="update">update</button>
  </main>
</template>

