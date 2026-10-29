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
  await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "AI disclosure", exact: true })
  ).toBeVisible();
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

test("shop matrix filters, shows stock, and prefills a quote", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/shop/catalog");

  await expect(
    page.getByRole("heading", { name: "Source-linked compatibility matrix." })
  ).toBeVisible();
  await expect(page.getByText("4GVMP").first()).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByText("R8D7N").first()).toBeVisible();

  await page.getByLabel("Search compatibility").fill("R8D7N");
  await expect(page.getByText("R8D7N").first()).toBeVisible();
  await page.getByText("R8D7N").first().click();
  await expect(page.getByText(/Seller reported out of stock/).first()).toBeVisible();
  await expect(page.getByText("4GVMP")).toHaveCount(0);

  await page.getByLabel("Search compatibility").fill("");
  await page.getByText("4GVMP").first().click();
  await expect(page.getByText("Fitment note")).toBeVisible();
  await expect(page.getByRole("link", { name: "Use in shop quote" })).toBeVisible();

  await page.getByRole("link", { name: "Use in shop quote" }).click();
  await expect(page).toHaveURL(/\/shop\?intake=/);
  await expect(page.getByLabel("Customer request")).toHaveValue(
    /Dell Latitude 5400, installed part 4GVMP/
  );
});

test("mobile pages do not overflow the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await mockStatus(page);
  await page.goto("/");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    )
  ).toBeLessThanOrEqual(1);

  await mockCatalog(page);
  for (const path of ["/catalog", "/shop", "/shop/catalog"]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(1);
  }
});

test("receipt survives a refresh and shows the verified capture", async ({
  page
}) => {
  test.setTimeout(90_000);
  await page.route("**/api/orders/TEST-ORDER", (route) =>
    route.fulfill({ json: fixture("receipt") })
  );
  await page.goto("/receipt/TEST-ORDER", {
    waitUntil: "domcontentloaded",
    timeout: 60_000
  });

  await expect(page.getByText("Payment complete — sandbox")).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByText("CAP-TEST-123").first()).toBeVisible();
  await expect(page.getByText("PAYMENT.CAPTURE.COMPLETED").first()).toBeVisible();
  await expect(page.getByText("Parts-People").first()).toBeVisible();

  await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });

  await expect(page.getByText("Payment complete — sandbox")).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByText("CAP-TEST-123").first()).toBeVisible();
});

test("PayPal return recovers the order into the receipt lookup", async ({
  page
}) => {
  await mockModels(page);
  await page.goto("/check?paypal=return&token=TEST-ORDER");

  await expect(
    page.getByText(/Returned from PayPal. Order TEST-ORDER/)
  ).toBeVisible();
  await expect(page.getByLabel("Payment recovery")).toHaveValue("TEST-ORDER");
});

test("a shop quote opens the buyer checkout flow", async ({ page }) => {
  await mockModels(page);
  await mockMatches(page);
  await page.route("**/api/repair-cases/case-test", (route) =>
    route.fulfill({
      json: {
        case: {
          modelId: "dell-latitude-5410",
          installedPartNumber: "R8D7N",
          designCapacityMwh: 51000,
          fullChargeCapacityMwh: 40000,
          symptomTags: ["battery_runtime_short"]
        }
      }
    })
  );

  await page.goto("/check?case=case-test");

  await expect(page.getByText(/Shop-reviewed quote/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Verified replacement" })
  ).toBeVisible({ timeout: 20_000 });
});

test("AI repair report uses the confirmed catalog case", async ({ page }) => {
  await mockModels(page);
  await mockMatches(page);
  await page.route("**/api/report", (route) =>
    route.fulfill({
      json: {
        ok: true,
        report: {
          title: "Test battery report",
          summary: "The catalog verified the selected part for this confirmed case.",
          health: "The reported capacity is above the replacement threshold.",
          fitment: "The selected 4GVMP family is the exact catalog match.",
          tradeoffs: "Lower-capacity alternatives are labelled.",
          safety: "No damaged-battery symptoms were selected.",
          nextSteps: ["Review the source evidence."],
          uncertainties: [],
          confidence: 0.9
        },
        source: {
          publisher: "Parts-People",
          url: "https://www.parts-people.com/index.php?action=item&id=30351"
        },
        part: {
          partNumber: "4GVMP",
          name: "Dell 68Wh 4-cell replacement battery (7.6V)",
          capacityWh: 68,
          voltage: "7.6",
          cells: 4,
          seller: "Parts-People",
          availability: "reported_in_stock"
        },
        ai: true
      }
    })
  );

  await page.goto("/check?demo=1");
  await page.getByRole("heading", { name: "Verified replacement" }).waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: "Edit details" }).click();
  await page.getByLabel(/Images, free-text/).check();
  await page.getByRole("button", { name: "Continue to symptoms" }).click();
  await page.getByText("Runs briefly / short runtime", { exact: true }).click();
  await page.getByRole("button", { name: "Check compatibility" }).click();
  await page.getByRole("heading", { name: "Verified replacement" }).waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: "Review this part" }).click();
  await page.getByRole("button", { name: "Generate report" }).click();
  await expect(page.getByRole("heading", { name: "Test battery report" })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByText("The catalog verified the selected part")).toBeVisible();
});

test("Start over clears the demo identity", async ({ page }) => {
  await mockModels(page);
  await mockMatches(page);
  await page.goto("/check?demo=1");

  await expect(
    page.getByRole("heading", { name: "Verified replacement" })
  ).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Start over" }).first().click();

  await expect(page.getByRole("combobox")).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Continue to battery" })
  ).toBeDisabled();
});

test("shop intake drafts a verified quote and adds it after approval", async ({
  page
}) => {
  await page.route("**/api/repair-cases", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { cases: [] } });
      return;
    }
    await route.fulfill({ json: { repairCaseId: "case-test" } });
  });
  await page.route("**/api/shop/intake", (route) =>
    route.fulfill({
      json: {
        ok: true,
        extraction: {
          modelQuery: "Latitude 5410",
          installedPartNumber: "R8D7N",
          designCapacityMwh: null,
          fullChargeCapacityMwh: null,
          symptomTags: ["battery_runtime_short"],
          clarifyingQuestion: null,
          safetyFlag: false,
          confidence: 0.93,
          warnings: []
        },
        match: {
          status: "verified_match",
          model: {
            id: "dell-latitude-5410",
            brand: "Dell",
            model: "Latitude 5410"
          },
          installedPart: { partNumber: "R8D7N" },
          healthPct: null,
          healthNote: null,
          exact: { part: { partNumber: "R8D7N" } },
          lowerCapacity: [{ part: { partNumber: "1V1XF" } }],
          excluded: [],
          reasons: [],
          safety: null
        },
        quote: {
          partId: "part-r8d7n-51wh",
          partNumber: "R8D7N",
          name: "Dell 51Wh 3-cell replacement battery (11.4V)",
          amount: "99.99",
          currency: "USD",
          seller: "Parts-People",
          sourcePublisher: "Parts-People",
          sourceUrl:
            "https://www.parts-people.com/index.php?action=item&id=30356",
          sellerUrl:
            "https://www.parts-people.com/index.php?action=search&search_query=R8D7N",
          fitmentNote: "Verified 51Wh 3-cell 11.4V option.",
          availability: "reported_in_stock",
          availabilityCheckedAt: "2026-10-28T12:00:00.000Z",
          availabilityNote: "Seller reported in stock for the test fixture.",
          availabilitySourceUrl: null,
          verifiedAt: "2026-10-26T12:00:00.000Z"
        },
        sellerUrl:
          "https://www.parts-people.com/index.php?action=search&search_query=R8D7N"
      }
    })
  );

  await page.goto("/shop");
  await page
    .getByLabel("Customer request")
    .fill("Dell Latitude 5410, battery label R8D7N, dies after 20 minutes.");
  await page.getByLabel(/This request is sent to Gemini/).check();
  await page.getByRole("button", { name: "Draft verified quote" }).click();

  await expect(page.getByText("R8D7N").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Buy at seller/ })).toBeVisible();

  await page.locator("#shop-review-confirmed").check();
  await expect(page.locator("#shop-review-confirmed")).toBeChecked();

  await page
    .getByLabel("Installed part correction (optional)")
    .fill("R8D7N ");
  await expect(page.locator("#shop-review-confirmed")).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Confirm review and add to queue" })
  ).toBeDisabled();

  await page.getByRole("button", { name: "Re-check catalog" }).click();
  await page.locator("#shop-review-confirmed").check();

  await page
    .getByRole("button", { name: "Confirm review and add to queue" })
    .click();
  await expect(
    page.getByRole("button", { name: "Added to shop queue" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "this checkout link" })
  ).toBeVisible();
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

test("an unsupported model clears the previous selection", async ({ page }) => {
  await mockModels(page);
  await page.goto("/check");

  await expect(page.getByRole("combobox")).toBeEnabled();
  await page.getByRole("combobox").selectOption("dell-latitude-5400");
  await page
    .getByPlaceholder("Latitude, Precision, Inspiron, 5410…")
    .fill("P92G");

  await expect(page.getByRole("combobox")).toHaveValue("");
  await expect(page.getByText(/Not in the verified catalog/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue to battery" })
  ).toBeDisabled();
});

test("check starts empty and requires an installed part number", async ({
  page
}) => {
  await mockModels(page);
  await page.goto("/check");

  await expect(page.getByRole("combobox")).toBeEnabled();
  await page.getByRole("combobox").selectOption("dell-latitude-5400");
  await page.getByRole("button", { name: "Continue to battery" }).click();

  await expect(page.getByLabel("Installed part number")).toHaveValue("");
  await expect(page.getByLabel("Design capacity (mWh, optional)")).toHaveValue("");
  await expect(page.getByLabel("Full charge capacity (mWh, optional)")).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Continue to symptoms" })
  ).toBeDisabled();

  await page.getByLabel("Installed part number").fill("X77XY");

  await expect(
    page.getByRole("button", { name: "Continue to symptoms" })
  ).toBeEnabled();
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
