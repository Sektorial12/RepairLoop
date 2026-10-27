import { expect, test } from "@playwright/test";
import {
  fixture,
  mockCatalog,
  mockMatches,
  mockModels,
  mockPayPal,
  mockStatus
} from "./helpers";

test("home explains the promise and links to the catalog", async ({ page }) => {
  await mockStatus(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Repair the right thing"
  );
  await expect(page.getByRole("link", { name: "Catalog" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Check my laptop battery" })).toBeVisible();
});

test("home stays online when the status probe is blocked", async ({ page }) => {
  await page.route("**/api/status", (route) => route.abort("blockedbyclient"));
  await mockModels(page);

  await page.goto("/");

  await expect(page.getByText("API online.")).toBeVisible();
  await expect(page.getByText(/Health details unavailable/)).toBeVisible();
  await expect(page.getByText("4 supported models")).toBeVisible();
});

test("catalog shows verified parts, the exclusion, and source freshness", async ({
  page
}) => {
  await mockCatalog(page);
  await page.goto("/catalog");

  await expect(page.getByRole("heading", { name: "Verified replacements" })).toBeVisible();
  await expect(page.getByText("4GVMP").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Explicitly excluded" })).toBeVisible();
  await expect(page.getByText("3HWPP").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Source freshness" })).toBeVisible();
  await expect(page.getByText("Parts-People").first()).toBeVisible();
});

test("receipt survives a refresh and shows the verified capture", async ({
  page
}) => {
  await page.route("**/api/orders/TEST-ORDER", (route) =>
    route.fulfill({ json: fixture("receipt") })
  );
  await page.goto("/receipt/TEST-ORDER");

  await expect(page.getByText("Payment complete — sandbox")).toBeVisible();
  await expect(page.getByText("CAP-TEST-123").first()).toBeVisible();
  await expect(page.getByText("PAYMENT.CAPTURE.COMPLETED").first()).toBeVisible();
  await expect(page.getByText("Parts-People").first()).toBeVisible();

  await page.reload();

  await expect(page.getByText("Payment complete — sandbox")).toBeVisible();
  await expect(page.getByText("CAP-TEST-123").first()).toBeVisible();
});

test("PayPal cancel return shows a no-charge notice", async ({ page }) => {
  await mockModels(page);
  await page.goto("/check?paypal=cancel");

  await expect(page.getByText(/Payment cancelled. No charge/)).toBeVisible();
  await expect(page.getByText("Payment complete — sandbox")).toHaveCount(0);
});

test.describe("PayPal failure states", () => {
  test.beforeEach(async ({ page }) => {
    await mockModels(page);
    await mockMatches(page);
  });

  test("in-checkout cancel reports no charge", async ({ page }) => {
    await mockPayPal(page, "cancel");
    await page.goto("/check?demo=review");

    await expect(
      page.getByRole("heading", { name: "Review the exact part" })
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("button", { name: "Pay with PayPal" })
    ).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "Pay with PayPal" }).click();

    await expect(page.getByText("Payment cancelled. No charge.")).toBeVisible();
    await expect(page.getByText("Payment complete — sandbox")).toHaveCount(0);
  });

  test("failed capture never shows success", async ({ page }) => {
    await mockPayPal(page, "capture-failure");
    await page.goto("/check?demo=review");

    await expect(
      page.getByRole("heading", { name: "Review the exact part" })
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("button", { name: "Pay with PayPal" })
    ).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "Pay with PayPal" }).click();

    await expect(page.getByText(/Do not assume success/)).toBeVisible();
    await expect(page.getByText("Payment complete — sandbox")).toHaveCount(0);
  });
});

test.describe("check flow scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await mockModels(page);
    await mockMatches(page);
  });

  test("demo verifies 4GVMP and excludes the 15.2V 3HWPP", async ({ page }) => {
    await page.goto("/check?demo=1");

    await expect(
      page.getByRole("heading", { name: "Verified replacement" })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("4GVMP").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Not verified for your configuration" })
    ).toBeVisible();
    await expect(page.getByText("3HWPP").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Review this part" })).toBeVisible();
  });

  test("an unknown installed part refuses checkout", async ({ page }) => {
    await page.goto("/check?demo=no-match");

    await expect(
      page.getByRole("heading", { name: "No verified match" })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("We will not guess.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Review selected part" })
    ).toHaveCount(0);
  });

  test("a damaged battery stops the flow before checkout", async ({ page }) => {
    await page.goto("/check?demo=safety");

    await expect(
      page.getByRole("heading", { name: "Stop — safety issue" })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Safety stop.").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Review selected part" })
    ).toHaveCount(0);
  });
});
