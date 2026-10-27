import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE =
  process.env.EVAL_BASE_URL ?? "https://repairloop-api.onrender.com";
const fixtures = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../test/fixtures"
);

let failures = 0;
let checks = 0;

function check(name: string, passed: boolean, detail = ""): void {
  checks += 1;
  if (!passed) failures += 1;
  console.log(
    `${passed ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`
  );
}

async function postJson<T>(route: string, body: unknown): Promise<T> {
  let response: Response | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await fetch(`${BASE}${route}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90000)
      });
    } catch (error) {
      if (attempt === 0) {
        console.log(`network error on ${route}; retrying in 10s`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
        continue;
      }
      throw error;
    }

    const retryable = [429, 502, 503, 504].includes(response.status);
    if (retryable && attempt === 0) {
      const wait = response.status === 429 ? 25000 : 10000;
      console.log(
        `transient ${response.status} on ${route}; waiting ${wait / 1000}s`
      );
      await new Promise((resolve) => setTimeout(resolve, wait));
      continue;
    }
    break;
  }

  if (!response || !response.ok) {
    const text = response ? await response.text() : "no response";
    throw new Error(
      `${route} returned ${response?.status ?? "none"}: ${text.slice(0, 300)}`
    );
  }

  const data = (await response.json()) as T;
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return data;
}

async function evalImages(): Promise<void> {
  const report = await readFile(path.join(fixtures, "battery-report.png"));
  const label = await readFile(path.join(fixtures, "battery-label.png"));

  const reportData = await postJson<{
    extraction: {
      partNumber: string | null;
      designCapacityMwh: number | null;
      fullChargeCapacityMwh: number | null;
      healthPct: number | null;
      confidence: number;
    };
  }>("/api/extract/battery-report", {
    imageBase64: report.toString("base64"),
    mimeType: "image/png"
  });

  const r = reportData.extraction;
  check("report: part number", r.partNumber === "X77XY", String(r.partNumber));
  check(
    "report: design capacity",
    r.designCapacityMwh === 68005,
    String(r.designCapacityMwh)
  );
  check(
    "report: full charge capacity",
    r.fullChargeCapacityMwh === 46907,
    String(r.fullChargeCapacityMwh)
  );
  check(
    "report: health",
    r.healthPct !== null && Math.abs(r.healthPct - 69) <= 1,
    String(r.healthPct)
  );
  check(
    "report: confidence >= 0.8",
    r.confidence >= 0.8,
    String(r.confidence)
  );

  const labelData = await postJson<{
    extraction: {
      brand: string | null;
      model: string | null;
      regulatoryModel: string | null;
      partNumber: string | null;
      capacityWh: number | null;
      voltage: number | null;
      confidence: number;
    };
  }>("/api/extract/label", {
    imageBase64: label.toString("base64"),
    mimeType: "image/png"
  });

  const l = labelData.extraction;
  check("label: brand", l.brand === "DELL", String(l.brand));
  check(
    "label: model",
    l.model?.includes("Latitude 5400") ?? false,
    String(l.model)
  );
  check("label: regulatory model", l.regulatoryModel === "P98G", String(l.regulatoryModel));
  check("label: part number", l.partNumber === "X77XY", String(l.partNumber));
  check("label: capacity", l.capacityWh === 68, String(l.capacityWh));
  check("label: voltage", l.voltage === 7.6, String(l.voltage));
  check(
    "label: confidence >= 0.8",
    l.confidence >= 0.8,
    String(l.confidence)
  );
}

const symptoms: Array<{
  text: string;
  tag: string | null;
  safety: boolean;
}> = [
  { text: "It runs for 30 seconds, then stops.", tag: "battery_runtime_short", safety: false },
  { text: "It won't charge at all.", tag: "battery_wont_charge", safety: false },
  { text: "The red light flashes when I press the trigger.", tag: "battery_red_light", safety: false },
  { text: "It only works when plugged in.", tag: "battery_wont_charge", safety: false },
  { text: "The battery drains in 10 minutes.", tag: "battery_runtime_short", safety: false },
  { text: "The battery is swollen and the laptop bulges.", tag: "battery_damaged", safety: true },
  { text: "There is a burning smell and the battery is hot.", tag: "battery_damaged", safety: true },
  { text: "It shuts down randomly at 40 percent.", tag: "battery_runtime_short", safety: false },
  { text: "The charge indicator stays at 0 percent.", tag: "battery_wont_charge", safety: false },
  {
    text: "I dropped it and now it won't turn on; I don't think it is the battery.",
    tag: null,
    safety: false
  }
];

async function evalSymptoms(): Promise<void> {
  for (const item of symptoms) {
    const data = await postJson<{
      extraction: {
        tags: string[];
        safetyFlag: boolean;
      };
    }>("/api/symptoms/parse", { text: item.text });

    const passed =
      item.tag === null
        ? data.extraction.tags.length === 0 && !data.extraction.safetyFlag
        : data.extraction.tags.includes(item.tag) &&
          data.extraction.safetyFlag === item.safety;

    check(
      `symptom: ${item.text.slice(0, 42)}`,
      passed,
      JSON.stringify(data.extraction.tags)
    );
  }
}

async function evalExplanation(): Promise<void> {
  const data = await postJson<{
    explanation: string;
    source: { url: string; publisher: string };
    ai: boolean;
    grounded: boolean;
  }>("/api/explain", {
    modelId: "dell-latitude-5400",
    installedPartNumber: "X77XY",
    designCapacityMwh: 68005,
    fullChargeCapacityMwh: 46907,
    symptomTags: ["battery_runtime_short"],
    partId: "part-4gvmp-68wh"
  });

  check(
    "explain: grounded",
    data.grounded && data.explanation.length >= 20,
    data.explanation.slice(0, 80)
  );
  check(
    "explain: cites catalog source",
    data.source.url.startsWith("https://www.parts-people.com/"),
    data.source.url
  );
  check(
    "explain: AI or valid catalog fallback",
    typeof data.ai === "boolean",
    `ai=${data.ai}`
  );
}

async function main(): Promise<void> {
  console.log(`Eval base: ${BASE}`);
  await evalImages();
  await evalSymptoms();
  await evalExplanation();
  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures > 0) {
    console.error(`${failures} check(s) failed`);
    process.exit(1);
  }
}

await main();
