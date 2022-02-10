import fetch from "jest-fetch-mock";
import { connect, create } from "../src/main";
import {
  FetchAuthorizedListSuccess,
  FetchCreateTableOnTablelandSuccess,
} from "./fauxFetch";

test("Throw error when not connected", async function () {
  await expect(create(" ")).rejects.toThrow(
    "Please connect your account before trying anything."
  );
});

test("Create table works", async function () {
  await connect({ host: "https://testnet.tableland.network" });
  fetch.mockResponseOnce(FetchAuthorizedListSuccess);
  fetch.mockResponseOnce(FetchCreateTableOnTablelandSuccess);

  const createReceipt = await create(
    "CREATE TABLE Hello (id int primary key, val text)"
  );
  expect(createReceipt.name).toEqual("Hello_115");
});
