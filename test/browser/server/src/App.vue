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
      <input type="text" name="statement" v-model="statement">
      <input type="text" name="success" v-model="successMsg">
      <input type="submit" name="submit" value="submit">
    </form>
  </main>
</template>

