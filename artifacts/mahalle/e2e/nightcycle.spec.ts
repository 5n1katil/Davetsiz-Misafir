import { test, expect } from "@playwright/test";

test.describe("Gece/gündüz döngüsü", () => {
  test("gece aksiyonları doğru sırada işlenir", async ({ page }) => {
    // TODO: implement — simulate full night cycle, verify role action order
  });

  test("gece eylemi açıklama kutusu görünür", async ({ page }) => {
    await page.goto("/");
    // TODO: implement — verify nightActionDescription box renders for all roles
  });
});
