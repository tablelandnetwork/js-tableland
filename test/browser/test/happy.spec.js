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
    await page.click("input[name=submit-sql]");

    await expect(page.getByTestId("status")).toHaveText(success);

    const responseStr = await page.getByTestId("response").textContent();
    const responseObj = JSON.parse(responseStr);

    tableName = responseObj.meta.txn.name;

    expect(tableName).toMatch(/browser_table/);
  });

  test("can insert", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    const success = "data was inserted";
    // TODO: potentially convert to typescript, but until then we need to ignore ts specific linting rules
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    await page.type("input[name=statement]", `INSERT INTO ${tableName} (k, v, num) VALUES ('name', 'number', 1);`);
    await page.type("input[name=success]", success);
    await page.click("input[name=submit-sql]");

    await expect(page.getByTestId("status")).toHaveText(success);
  });

  test("can update", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    const success = "table was updated";
    // TODO: potentially convert to typescript, but until then we need to ignore ts specific linting rules
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    await page.type("input[name=statement]", `UPDATE ${tableName} SET num = 2 WHERE num = 1;`);
    await page.type("input[name=success]", success);
    await page.click("input[name=submit-sql]");

    await expect(page.getByTestId("status")).toHaveText(success);
  });

  test("can read", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    const success = "table was read";
    // TODO: potentially convert to typescript, but until then we need to ignore ts specific linting rules
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    await page.type("input[name=statement]", `SELECT * FROM ${tableName};`);
    await page.type("input[name=success]", success);
    await page.click("input[name=submit-sql]");

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
    // TODO: potentially convert to typescript, but until then we need to ignore ts specific linting rules
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    await page.type("input[name=statement]", `DELETE FROM ${tableName} WHERE num = 2;`);
    await page.type("input[name=success]", success);
    await page.click("input[name=submit-sql]");

    await expect(page.getByTestId("status")).toHaveText(success);
  });

  test("can get validator health", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    await page.click("input[name=health]");

    await expect(page.getByTestId("status")).toHaveText("validator health is good");
  });

  test("can get table by id", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    await page.type("input[name=tableid]", `1`);
    await page.click("input[name=get-table]");
    await expect(page.getByTestId("status")).toHaveText("table name: healthbot_31337_1");

    const schemaStr = await page.getByTestId("response").textContent();
    const schema = JSON.parse(schemaStr);

    expect(schema.columns.length).toEqual(1);
    expect(schema.columns[0].name).toEqual("counter");
    expect(schema.columns[0].type).toEqual("integer");
  });

  test("can get my tables", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    // create a table for this test, so we don't rely on other test's tables
    const success = "table was created";
    await page.type("input[name=statement]", "CREATE TABLE regi_test (k text, v text);");
    await page.type("input[name=success]", success);
    await page.click("input[name=submit-sql]");

    await expect(page.getByTestId("status")).toHaveText(success);

    // now that the table exists, test that the registry can get the table
    await page.click("input[name=get-my-tables]");
    await expect(page.getByTestId("status")).toHaveText("got my tables");

    const tablesStr = await page.getByTestId("response").textContent();
    const tables = JSON.parse(tablesStr);

    expect(tables.length).toBeGreaterThan(0);
    expect(tables[tables.length - 1].chainId).toEqual(31337);
    // test that the last table created has a tableId that is a string of a number
    expect(isNaN(Number(tables[tables.length - 1].tableId))).toEqual(false);
  });

});
