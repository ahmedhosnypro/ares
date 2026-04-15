import { expect, test } from "@playwright/test";

test("about page renders", async ({ page }) => {
  await page.goto("/about");

  await expect(page.getByRole("heading", { name: "About" })).toBeVisible();
});

test("home page renders landing content", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /find the right car for your next adventure/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /find cars/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /search cars/i })).toBeVisible();
  await expect(page.getByText(/trusted providers you can count on/i)).toBeVisible();
});
