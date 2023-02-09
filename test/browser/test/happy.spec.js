import { test, expect } from "@playwright/test";

test.describe("browser tests", function () {

  test("has title", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Tableland SDK Test App/);
  });

  test("can create, insert, update, read, and delete a table", async function ({ page }) {
    await page.goto("http://localhost:5173/");

    await page.getByRole("button", { name: "create" }).click();
    await expect(page.getByTestId("status")).toHaveText(/table was created/i);

    await page.getByRole("button", { name: "insert" }).click();
    await expect(page.getByTestId("status")).toHaveText("data was inserted");

    await page.getByRole("button", { name: "update" }).click();
    await expect(page.getByTestId("status")).toHaveText("table was updated");

    await page.getByRole("button", { name: "read" }).click();
    await expect(page.getByTestId("status")).toHaveText(/table was read, data is/);

    // await page.getByRole("button", { name: "dodelete" }).click();
    // await expect(page.getByTestId("status")).toHaveText("data was deleted");
  });

});
