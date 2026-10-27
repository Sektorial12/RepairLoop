import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";

const fixtureDir = join(__dirname, "fixtures");

export function fixture<T>(name: string): T {
  return JSON.parse(
    readFileSync(join(fixtureDir, `${name}.json`), "utf8")
  ) as T;
}

export async function mockModels(page: Page): Promise<void> {
  await page.route("**/api/models", (route) =>
    route.fulfill({ json: fixture("models") })
  );
}

export async function mockStatus(page: Page): Promise<void> {
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: {
        ok: true,
        db: "up",
        aiConfigured: true,
        paypalConfigured: true
      }
    })
  );
  await mockModels(page);
}

export async function mockCatalog(page: Page): Promise<void> {
  await page.route("**/api/catalog", (route) =>
    route.fulfill({ json: fixture("catalog") })
  );
}

export async function mockPayPal(
  page: Page,
  action: "cancel" | "capture-failure"
): Promise<void> {
  await page.route("**/api/paypal/config", (route) =>
    route.fulfill({
      json: {
        clientId: "test-client",
        environment: "sandbox",
        currency: "USD"
      }
    })
  );

  const actionCode =
    action === "cancel"
      ? "options.onCancel();"
      : "void options.onApprove({ orderID: 'ORDER-TEST' });";
  const script = `window.paypal = { Buttons: (options) => ({ render: async (element) => { const button = document.createElement("button"); button.type = "button"; button.textContent = "Pay with PayPal"; button.onclick = () => { ${actionCode} }; element.appendChild(button); } }) };`;

  await page.route("https://www.paypal.com/sdk/js**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: script })
  );

  await page.route("**/api/checkout/orders/ORDER-TEST/capture", (route) =>
    route.fulfill({
      status: 502,
      json: { error: "capture_not_completed" }
    })
  );
}

export async function mockMatches(page: Page): Promise<void> {
  await page.route("**/api/match", async (route) => {
    const body = route.request().postDataJSON() as {
      installedPartNumber?: string;
      symptomTags?: string[];
    };
    const name =
      body.installedPartNumber === "UNKNOWN-123"
        ? "match-no-match"
        : body.symptomTags?.includes("battery_damaged")
          ? "match-safety"
          : "match-demo";

    await route.fulfill({ json: fixture(name) });
  });
}
