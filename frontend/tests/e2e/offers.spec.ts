import { expect, test } from "@playwright/test";

test("offers page renders", async ({ page }) => {
  await page.goto("/offers");
  await expect(page.getByRole("heading", { name: /offers & deals/i })).toBeVisible();
});

test("offers page shows content or empty state", async ({ page }) => {
  await page.goto("/offers");
  const hasOffers = await page.locator("[data-testid='offer-card']").count();
  if (hasOffers === 0) {
    await expect(page.getByText(/no offers available/i)).toBeVisible();
  }
});
