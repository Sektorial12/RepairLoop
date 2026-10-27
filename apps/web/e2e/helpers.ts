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
  await page.route("**/health", (route) =>
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
