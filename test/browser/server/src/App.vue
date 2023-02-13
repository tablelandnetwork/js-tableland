<script lang="ts">

import {
  Database,
  Validator,
  Registry,
  helpers
} from "../../../../dist/esm/index.js";
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

const validator = new Validator(db.config);
const registry = new Registry(db.config);

export default {
  data: function () {
    return {
      tablename: "",
      tableId: "",
      message: "",
      statement: "",
      successMsg: "",
      responseJson: ""
    };
  },

  methods: {
    runSql: async function (statementArg, successArg) {
      try {
        const statementStr = (statementArg || this.$data.statement).trim();
        const successMsg = (successArg || this.$data.successMsg).trim();

        if (!statementStr) throw new Error("no statement available");
        if (!successMsg) throw new Error("no success message available");

        const res = await db
          .prepare(statementStr)
          .all();

        this.$data.message = successMsg;
        this.$data.responseJson = JSON.stringify(res);

        return res;
      } catch (err) {
        this.$data.message = `runSql Error: ${err}`;
      }
    },
    validatorHealth: async function () {
      const isHealthy = await validator.health();

      this.$data.message = `validator health is ${isHealthy ? "good" : "not good"}`;
    },
    getTable: async function () {
      const { name, schema } = await validator.getTableById({ chainId: 31337, tableId: this.$data.tableId });

      this.$data.message = `table name: ${name}`
      this.$data.responseJson = JSON.stringify(schema);
    },
    getMyTables: async function () {
      const tables = await registry.listTables();

      this.$data.message = "got my tables";
      this.$data.responseJson = JSON.stringify(tables);
    }
  }
}

</script>

<template>
  <div data-testid="status">
    {{ message }}
  </div>

  <div data-testid="response">
    {{ responseJson }}
  </div>

  <main>
    <form @submit.prevent="eve => runSql()">
      <input type="text" name="statement" v-model="statement" placeholder="sql statement">
      <input type="text" name="success" v-model="successMsg" placeholder="success message">
      <input type="submit" name="submit-sql" value="submit">
    </form>

    <form @submit.prevent="eve => validatorHealth()">
      <input type="submit" name="health" value="submit">
    </form>

    <form @submit.prevent="eve => getTable()">
      <input type="text" name="tableid" v-model="tableId" placeholder="table id">
      <input type="submit" name="get-table" value="submit">
    </form>

    <form @submit.prevent="eve => getMyTables()">
      <input type="submit" name="get-my-tables" value="submit">
    </form>
  </main>
</template>

