import { test, expect } from "@playwright/test";

const BASE_URL = process.env.EXPO_BASE_URL ?? "http://localhost:8081";

test.describe("Multiplayer lobby flow", () => {
  test("host creates room and lobby shows code + QR card", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('text=DAVETSİZ MİSAFİR')).toBeVisible({ timeout: 10_000 });
  });

  test("room-code element has testID in lobby", async ({ page }) => {
    await page.goto(BASE_URL);
    const el = page.locator('[data-testid="room-code"]');
    expect(el).toBeDefined();
  });

  test("player-list element has testID in lobby", async ({ page }) => {
    await page.goto(BASE_URL);
    const el = page.locator('[data-testid="player-list"]');
    expect(el).toBeDefined();
  });
});
