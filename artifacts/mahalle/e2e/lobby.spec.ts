import { test, expect } from "@playwright/test";

test.describe("Lobi akışı", () => {
  test("oda kurma ve katılım", async ({ page }) => {
    await page.goto("/");
    // TODO: implement — create room, join with second player, verify lobby state
  });

  test("host, oda kodunu paylaşabilir", async ({ page }) => {
    await page.goto("/");
    // TODO: implement — verify room code visible and copyable
  });
});
