import { test, expect } from "@playwright/test";

test.describe("Oyun sonu ekranı", () => {
  test("kazanan doğru gösterilir", async ({ page }) => {
    // TODO: implement — simulate end state, verify winner label and team
  });

  test("Kıskanç Komşu eş-kazanan altın rengi ile gösterilir", async ({ page }) => {
    // TODO: implement — verify co-winner gold styling on EndScreen
  });
});
