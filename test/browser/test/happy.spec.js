import { test, expect } from "@playwright/test";

test.describe("browser tests", function () {
  let tableName;

  test("has title", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Tableland SDK Test App/);
  });

  test("can create", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    const success = "table was created";
    await page.type("input[name=statement]", "CREATE TABLE browser_table (k text, v text, num integer);");
    await page.type("input[name=success]", success);
    await page.click("input[name=submit]");

    await expect(page.getByTestId("status")).toHaveText(success);

    const responseStr = await page.getByTestId("response").textContent();
    const responseObj = JSON.parse(responseStr);

    tableName = responseObj.meta.txn.name;

    expect(tableName).toMatch(/browser_table/);
  });

  test("can insert", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    const success = "data was inserted";
    await page.type("input[name=statement]", `INSERT INTO ${tableName} (k, v, num) VALUES ('name', 'number', 1);`);
    await page.type("input[name=success]", success);
    await page.click("input[name=submit]");

    await expect(page.getByTestId("status")).toHaveText(success);
  });

  test("can update", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    const success = "table was updated";
    await page.type("input[name=statement]", `UPDATE ${tableName} SET num = 2 WHERE num = 1;`);
    await page.type("input[name=success]", success);
    await page.click("input[name=submit]");

    await expect(page.getByTestId("status")).toHaveText(success);
  });

  test("can read", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    const success = "table was read";
    await page.type("input[name=statement]", `SELECT * FROM ${tableName};`);
    await page.type("input[name=success]", success);
    await page.click("input[name=submit]");

    await expect(page.getByTestId("status")).toHaveText(success);

    const responseStr = await page.getByTestId("response").textContent();
    const responseObj = JSON.parse(responseStr);

    const results = responseObj.results

    expect(results.length).toEqual(1);
    expect(results[0].k).toEqual("name");
    expect(results[0].v).toEqual("number");
    expect(results[0].num).toEqual(2);
  });

  test("can delete", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    const success = "data was deleted";
    await page.type("input[name=statement]", `DELETE FROM ${tableName} WHERE num = 2;`);
    await page.type("input[name=success]", success);
    await page.click("input[name=submit]");

    await expect(page.getByTestId("status")).toHaveText(success);
  });

});
