import fetch from "jest-fetch-mock";
import { connect, createTable } from "../src/main";
import {
  FetchAuthorizedListSuccess,
  FetchCreateTableOnTablelandSuccess,
} from "./fauxFetch";

test("Throw error when not connected", async function () {
  await expect(createTable(" ")).rejects.toThrow(
    "Please connect your account before trying anything."
  );
});

test("Create table works", async function () {
  await connect({ host: "https://testnet.tableland.network" });
  fetch.mockResponseOnce(FetchAuthorizedListSuccess);
  fetch.mockResponseOnce(FetchCreateTableOnTablelandSuccess);

  const createTableReceipt = await createTable(
    "CREATE TABLE Hello (id int primary key, val text)"
  );
  expect(createTableReceipt.name).toEqual("Hello_115");
});
