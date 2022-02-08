import fetch from "jest-fetch-mock";
import { connect } from "../src/main";

beforeEach(() => {
  fetch.resetMocks();
  connect({ host: "https://testnet.tableland.network" });
});

test("Check connect", async function () {
  const connectReceipt = await connect();

  expect(connectReceipt.ethAccounts).toMatchObject([""]);
});
