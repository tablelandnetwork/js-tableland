import fetch from "jest-fetch-mock";
import { connect, createTable } from '../src/main';
import { FetchAuthorizedListSuccess, FetchCreateTableOnTablelandSuccess } from './fauxFetch';



test("Throw error when not connected", async function() {
    await expect(createTable(" ")).rejects.toThrow("Please connect your account before trying anything.");
});
  

test("Create table works", async function() {
    await connect({validatorHost: "https://testnet.tableland.network"});
    fetch.mockResponseOnce(FetchAuthorizedListSuccess);
    fetch.mockResponseOnce(FetchCreateTableOnTablelandSuccess);

    let createTableReceipt = await createTable("CREATE TABLE Hello (id int primary key, val text)");
    expect(createTableReceipt.id).toEqual("115");
    expect(createTableReceipt.name).toEqual("Hello");
});