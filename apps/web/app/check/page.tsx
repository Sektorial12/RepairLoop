"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiBaseUrl } from "../lib/api";
import { PayPalCheckout } from "./PayPalCheckout";
import type { OrderPayload, Receipt } from "./PayPalCheckout";

type Model = {
  id: string;
  brand: string;
  family: string;
  model: string;
  aliases: string[];
  regulatoryModel?: string | null;
};

type Part = {
  id: string;
  name: string;
  category: string;
  capacityWh: number;
  voltage: string;
  cells: number;
  partNumber: string;
  altPartNumbers: string[];
  seller: string;
  priceDemo: string;
  currency: string;
  status: string;
  sourceId: string;
  verifiedAt: string | null;
  notes?: string | null;
};

type Compatibility = {
  id: string;
  modelId: string;
  partId: string;
  fitmentNote: string;
  sourceId: string;
  evidenceQuote?: string | null;
  status: string;
  verifiedAt: string | null;
};

type Source = {
  id: string;
  publisher: string;
  url: string;
  accessedAt: string;
  licenseTerms?: string | null;
  notes?: string | null;
};

type MatchOption = {
  part: Part;
  compatibility: Compatibility;
  matchKind: "exact" | "lower_capacity";
  reason: string;
};

type MatchResult = {
  status: "verified_match" | "no_match" | "safety_stop";
  model?: Model;
  installedPart?: Part;
  healthPct?: number;
  healthNote?: string;
  exact?: MatchOption;
  lowerCapacity: MatchOption[];
  excluded: Array<{ part: Part; reason: string }>;
  reasons: string[];
  safety?: { tag: string; label: string; message: string };
  sources?: Source[];
};

type Payload = {
  modelId?: string;
  modelQuery?: string;
  installedPartNumber?: string;
  designCapacityMwh?: number;
  fullChargeCapacityMwh?: number;
  symptomTags: string[];
};

type BatteryReportExtraction = {
  model: string | null;
  partNumber: string | null;
  designCapacityMwh: number | null;
  fullChargeCapacityMwh: number | null;
  healthPct: number | null;
  cycleCount: number | null;
  confidence: number;
  warnings: string[];
};

type LabelExtraction = {
  brand: string | null;
  model: string | null;
  regulatoryModel: string | null;
  serialPrefix: string | null;
  partNumber: string | null;
  capacityWh: number | null;
  voltage: number | null;
  confidence: number;
  warnings: string[];
};

type SymptomExtraction = {
  tags: string[];
  clarifyingQuestion: string | null;
  safetyFlag: boolean;
  safetyReason: string | null;
  confidence: number;
};

const DEMO: Payload = {
  modelId: "dell-latitude-5400",
  installedPartNumber: "X77XY",
  designCapacityMwh: 68005,
  fullChargeCapacityMwh: 46907,
  symptomTags: ["battery_runtime_short"]
};

const SYMPTOMS = [
  { tag: "battery_runtime_short", label: "Runs briefly / short runtime" },
  { tag: "battery_wont_charge", label: "Won't charge" },
  { tag: "battery_red_light", label: "Red / flashing light" },
  {
    tag: "battery_damaged",
    label: "Swollen, leaking, overheating, or burning smell",
    safety: true
  }
];

const STEPS = ["Device", "Battery", "Symptoms", "Result", "Review"];

const REASON_LABELS: Record<string, string> = {
  unsupported_model: "This model is not supported yet.",
  unknown_installed_part: "We could not identify the installed part.",
  installed_part_unverified:
    "The installed part is not verified for this configuration.",
  no_verified_replacement: "We could not verify an exact replacement.",
  missing_identity: "Add the model or installed part number.",
  unknown_capacity: "We could not match the reported capacity.",
  no_catalog_for_model: "There is no verified catalog for this model yet.",
  voltage_mismatch:
    "Different voltage — not verified for your configuration.",
  higher_capacity_not_exact: "Higher capacity — not the exact original.",
  different_capacity: "Different capacity — not the exact original.",
  unverified_for_configuration: "Unverified for your configuration."
};

const REPAIR_GUIDES = [
  {
    label: "Dell service manual",
    href: "https://www.dell.com/support/manuals/en-us/latitude-14-5400-laptop/latitude_5400_servicemanual/removing-the-battery"
  },
  {
    label: "iFixit guide",
    href: "https://www.ifixit.com/Guide/Dell+Latitude+5400+Battery+Replacement/201472"
  }
];

function money(value: string, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value));
}

function dateLabel(value: string | null): string {
  if (!value) return "not verified";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function healthLabel(percent?: number): string {
  if (percent === undefined) return "Not reported";
  return `${percent.toFixed(1)}%`;
}

export default function CheckPage() {
  const [step, setStep] = useState(0);
  const [models, setModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelId, setModelId] = useState("dell-latitude-5400");
  const [installedPartNumber, setInstalledPartNumber] = useState("X77XY");
  const [designCapacityMwh, setDesignCapacityMwh] = useState("68005");
  const [fullChargeCapacityMwh, setFullChargeCapacityMwh] = useState("46907");
  const [symptomTags, setSymptomTags] = useState<string[]>([
    "battery_runtime_short"
  ]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [labelFileName, setLabelFileName] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [selectedOption, setSelectedOption] = useState<MatchOption | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [aiBusy, setAiBusy] = useState<
    null | "report" | "label" | "symptoms"
  >(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [symptomText, setSymptomText] = useState("");
  const [clarifyingQuestion, setClarifyingQuestion] = useState<string | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/models`, {
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const data = (await response.json()) as { models: Model[] };
        if (!cancelled) {
          setModels(data.models);
          if (
            data.models.length > 0 &&
            !data.models.some((model) => model.id === modelId)
          ) {
            setModelId(data.models[0].id);
          }
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Could not load models"
          );
        }
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [modelId]);

  const selectedModel = models.find((model) => model.id === modelId);
  const sourceFor = (sourceId?: string): Source | undefined =>
    result?.sources?.find((source) => source.id === sourceId);

  const normalizeValue = (value: string): string =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const findModel = (query: string | null | undefined): Model | undefined => {
    if (!query) return undefined;
    const normalizedQuery = normalizeValue(query);
    return models.find((model) =>
      [model.model, ...model.aliases].some((candidate) => {
        const normalized = normalizeValue(candidate);
        return (
          normalized === normalizedQuery ||
          normalized.includes(normalizedQuery) ||
          normalizedQuery.includes(normalized)
        );
      })
    );
  };

  const fileToBase64 = (file: File): Promise<{
    base64: string;
    mimeType: string;
  }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result);
        const match = result.match(/^data:([^;]+);base64,([\s\S]+)$/);
        if (!match) {
          reject(new Error("Could not read the image"));
          return;
        }
        resolve({ base64: match[2], mimeType: match[1] });
      };
      reader.onerror = () => reject(new Error("Could not read the image"));
      reader.readAsDataURL(file);
    });

  const apiErrorMessage = async (
    response: Response,
    fallback: string
  ): Promise<string> => {
    const body = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;

    switch (body?.error) {
      case "ai_not_configured":
        return "AI extraction is unavailable; enter the values manually.";
      case "ai_rate_limited":
        return "AI is busy right now; try again or enter the values manually.";
      case "ai_timeout":
        return "AI timed out; enter the values manually.";
      case "invalid_ai_output":
        return "AI could not read the image reliably; enter the values manually.";
      default:
        return body?.message ?? fallback;
    }
  };

  const toggleSymptom = (tag: string) => {
    setSymptomTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  };

  const buildPayload = (overrides?: Partial<Payload>): Payload => ({
    modelId,
    installedPartNumber: installedPartNumber.trim() || undefined,
    designCapacityMwh: Number(designCapacityMwh) || undefined,
    fullChargeCapacityMwh: Number(fullChargeCapacityMwh) || undefined,
    symptomTags,
    ...overrides
  });

  const runMatch = async (overrides?: Partial<Payload>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/match`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildPayload(overrides))
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `API returned ${response.status}`);
      }

      const data = (await response.json()) as MatchResult;
      setResult(data);
      setSelectedOption(
        data.status === "verified_match" && data.exact ? data.exact : null
      );
      setStep(3);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not run the match"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = async () => {
    setModelId("dell-latitude-5400");
    setInstalledPartNumber("X77XY");
    setDesignCapacityMwh("68005");
    setFullChargeCapacityMwh("46907");
    setSymptomTags(["battery_runtime_short"]);
    setFileName(null);
    setLabelFileName(null);
    setAiBusy(null);
    setAiMessage(null);
    setAiWarnings([]);
    setAiConfidence(null);
    setSymptomText("");
    setClarifyingQuestion(null);
    setReceipt(null);
    await runMatch(DEMO);
  };

  const handleReportFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 6_000_000) {
      setError("Image is too large. Use a screenshot under 6 MB.");
      return;
    }

    setFileName(file.name);
    setAiBusy("report");
    setAiMessage(null);
    setAiWarnings([]);
    setAiConfidence(null);
    setError(null);

    try {
      const image = await fileToBase64(file);
      const response = await fetch(`${apiBaseUrl}/api/extract/battery-report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageBase64: image.base64,
          mimeType:
            image.mimeType === "image/jpeg" || image.mimeType === "image/webp"
              ? image.mimeType
              : "image/png"
        })
      });

      if (!response.ok) {
        throw new Error(
          await apiErrorMessage(response, "Could not extract the report")
        );
      }

      const data = (await response.json()) as {
        extraction: BatteryReportExtraction;
      };
      const extraction = data.extraction;

      if (extraction.partNumber) {
        setInstalledPartNumber(extraction.partNumber);
      }
      if (extraction.designCapacityMwh) {
        setDesignCapacityMwh(String(extraction.designCapacityMwh));
      }
      if (extraction.fullChargeCapacityMwh) {
        setFullChargeCapacityMwh(String(extraction.fullChargeCapacityMwh));
      }

      setAiConfidence(extraction.confidence);
      setAiWarnings(extraction.warnings);
      setAiMessage(
        "Report extracted. Check every value before continuing."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not extract the report"
      );
    } finally {
      setAiBusy(null);
    }
  };

  const handleLabelFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 6_000_000) {
      setError("Image is too large. Use a photo under 6 MB.");
      return;
    }

    setLabelFileName(file.name);
    setAiBusy("label");
    setAiMessage(null);
    setAiWarnings([]);
    setAiConfidence(null);
    setError(null);

    try {
      const image = await fileToBase64(file);
      const response = await fetch(`${apiBaseUrl}/api/extract/label`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageBase64: image.base64,
          mimeType:
            image.mimeType === "image/jpeg" || image.mimeType === "image/webp"
              ? image.mimeType
              : "image/png"
        })
      });

      if (!response.ok) {
        throw new Error(
          await apiErrorMessage(response, "Could not extract the label")
        );
      }

      const data = (await response.json()) as {
        extraction: LabelExtraction;
      };
      const extraction = data.extraction;

      if (extraction.partNumber) {
        setInstalledPartNumber(extraction.partNumber);
      }
      const matchedModel = findModel(extraction.model);
      if (matchedModel) {
        setModelId(matchedModel.id);
      }
      if (extraction.capacityWh && !designCapacityMwh) {
        setDesignCapacityMwh(String(Math.round(extraction.capacityWh * 1000)));
      }

      setAiConfidence(extraction.confidence);
      setAiWarnings(extraction.warnings);
      setAiMessage(
        extraction.capacityWh && extraction.voltage
          ? `Label suggests ${extraction.capacityWh}Wh / ${extraction.voltage}V. Confirm the part number before matching.`
          : "Label extracted. Confirm the part number before matching."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not extract the label"
      );
    } finally {
      setAiBusy(null);
    }
  };

  const handleParseSymptoms = async () => {
    if (!symptomText.trim()) return;

    setAiBusy("symptoms");
    setError(null);
    setClarifyingQuestion(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/symptoms/parse`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: symptomText })
      });

      if (!response.ok) {
        throw new Error(
          await apiErrorMessage(response, "Could not read the symptom")
        );
      }

      const data = (await response.json()) as {
        extraction: SymptomExtraction;
      };
      const extraction = data.extraction;
      const merged = Array.from(
        new Set([
          ...symptomTags,
          ...extraction.tags,
          ...(extraction.safetyFlag ? ["battery_damaged"] : [])
        ])
      );

      setSymptomTags(merged);
      setClarifyingQuestion(extraction.clarifyingQuestion);
      setAiConfidence(extraction.confidence);
      setAiWarnings(
        extraction.safetyReason ? [extraction.safetyReason] : []
      );
      setAiMessage("Symptoms mapped. Review the chips and safety state.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not read the symptom"
      );
    } finally {
      setAiBusy(null);
    }
  };

  const reset = () => {
    setStep(0);
    setResult(null);
    setSelectedOption(null);
    setError(null);
    setModelId("dell-latitude-5400");
    setInstalledPartNumber("X77XY");
    setDesignCapacityMwh("68005");
    setFullChargeCapacityMwh("46907");
    setSymptomTags(["battery_runtime_short"]);
    setFileName(null);
    setLabelFileName(null);
    setAiBusy(null);
    setAiMessage(null);
    setAiWarnings([]);
    setAiConfidence(null);
    setSymptomText("");
    setClarifyingQuestion(null);
    setReceipt(null);
  };

  const chooseOption = (option: MatchOption) => {
    setSelectedOption(option);
    setReceipt(null);
    setStep(4);
  };

  const orderPayload: OrderPayload | null = selectedOption
    ? {
        modelId,
        installedPartNumber: installedPartNumber.trim() || undefined,
        designCapacityMwh: Number(designCapacityMwh) || undefined,
        fullChargeCapacityMwh: Number(fullChargeCapacityMwh) || undefined,
        symptomTags,
        partId: selectedOption.part.id
      }
    : null;

  const demoStarted = useRef(false);

  useEffect(() => {
    if (demoStarted.current) return;
    if (typeof window === "undefined") return;
    const scenario = new URLSearchParams(window.location.search).get("demo");
    if (!scenario) return;

    demoStarted.current = true;

    if (scenario === "1") {
      void loadDemo();
      return;
    }

    if (scenario === "no-match") {
      setInstalledPartNumber("UNKNOWN-123");
      setDesignCapacityMwh("68005");
      setFullChargeCapacityMwh("46907");
      setSymptomTags(["battery_runtime_short"]);
      void runMatch({
        modelId: "dell-latitude-5400",
        installedPartNumber: "UNKNOWN-123",
        designCapacityMwh: 68005,
        fullChargeCapacityMwh: 46907,
        symptomTags: ["battery_runtime_short"]
      });
      return;
    }

    if (scenario === "safety") {
      setInstalledPartNumber("X77XY");
      setDesignCapacityMwh("68005");
      setFullChargeCapacityMwh("46907");
      setSymptomTags(["battery_damaged"]);
      void runMatch({
        modelId: "dell-latitude-5400",
        installedPartNumber: "X77XY",
        designCapacityMwh: 68005,
        fullChargeCapacityMwh: 46907,
        symptomTags: ["battery_damaged"]
      });
    }
  }, []);

  return (
    <main>
      <div className="shell">
        <nav className="nav">
          <Link className="brand" href="/">
            <span className="brand-mark">R</span>
            <span>RepairLoop</span>
          </Link>
          <span className="badge">Sandbox prototype</span>
        </nav>

        <div className="check-shell">
          <div className="check-head">
            <div>
              <p className="eyebrow">Guided battery check</p>
              <h1 className="check-title">
                Find the exact replacement. Or stop.
              </h1>
              <p className="lede">
                Enter the battery report values or the installed part number;
                the catalog does the fitment check.
              </p>
            </div>
            <div className="check-actions">
              <button
                className="button primary"
                type="button"
                onClick={() => void loadDemo()}
                disabled={loading}
              >
                {loading ? "Checking…" : "Load demo case"}
              </button>
              <button className="button ghost" type="button" onClick={reset}>
                Start over
              </button>
            </div>
          </div>

          <ol className="stepper" aria-label="Check progress">
            {STEPS.map((label, index) => (
              <li
                key={label}
                className={`step-pill ${index === step ? "active" : ""} ${
                  index < step ? "done" : ""
                }`}
                aria-current={index === step ? "step" : undefined}
              >
                <span>{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>

          {error ? (
            <div className="notice notice-danger" role="alert">
              <strong>Something went wrong.</strong> {error}
              <p className="status-note">
                API: <code>{apiBaseUrl}</code>
              </p>
            </div>
          ) : null}

          {step === 0 ? (
            <section className="flow-card" aria-labelledby="device-heading">
              <div className="flow-card-head">
                <span className="pill">Step 1</span>
                <h2 id="device-heading">What laptop are we repairing?</h2>
              </div>
              <div className="field-grid">
                <label className="field">
                  <span>Supported model</span>
                  <select
                    value={modelId}
                    onChange={(event) => setModelId(event.target.value)}
                    disabled={modelsLoading}
                  >
                    {modelsLoading ? (
                      <option>Loading models…</option>
                    ) : (
                      models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.brand} {model.model}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <div className="field">
                  <span>Current support</span>
                  <p className="field-static">
                    {selectedModel
                      ? `${selectedModel.brand} ${selectedModel.model} · battery family`
                      : "Choose a supported model"}
                  </p>
                </div>
              </div>
              <p className="hint">
                We start with the Dell Latitude 5400 battery family. Unsupported
                models get a clear “no verified match” instead of a guess.
              </p>
              <div className="button-row">
                <button
                  className="button primary"
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={modelsLoading}
                >
                  Continue to battery
                </button>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="flow-card" aria-labelledby="battery-heading">
              <div className="flow-card-head">
                <span className="pill">Step 2</span>
                <h2 id="battery-heading">Battery report or label</h2>
              </div>

              <div className="upload-box">
                <div>
                  <strong>Have a battery report screenshot?</strong>
                  <p>
                    Upload a report image to prefill the fields. Review every
                    extracted value before matching.
                  </p>
                </div>
                <label className="upload-button">
                  Choose report image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) =>
                      void handleReportFile(event.target.files?.[0])
                    }
                    disabled={aiBusy !== null}
                  />
                </label>
                {fileName ? (
                  <p className="status-note">Selected: {fileName}</p>
                ) : null}
              </div>

              <div className="upload-box">
                <div>
                  <strong>Have a battery or model label photo?</strong>
                  <p>
                    Upload a label image to prefill the part number and model.
                    Review every value before matching.
                  </p>
                </div>
                <label className="upload-button">
                  Choose label image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) =>
                      void handleLabelFile(event.target.files?.[0])
                    }
                    disabled={aiBusy !== null}
                  />
                </label>
                {labelFileName ? (
                  <p className="status-note">Selected: {labelFileName}</p>
                ) : null}
              </div>

              {aiBusy ? (
                <div className="notice">
                  {aiBusy === "report"
                    ? "Reading the battery report…"
                    : aiBusy === "label"
                      ? "Reading the label…"
                      : "Reading the symptom…"}
                </div>
              ) : null}
              {aiMessage ? <p className="hint">{aiMessage}</p> : null}
              {aiConfidence !== null ? (
                <p className="hint">
                  AI confidence: {Math.round(aiConfidence * 100)}%
                </p>
              ) : null}
              {aiWarnings.length > 0 ? (
                <div className="notice notice-warning">
                  <strong>Check these:</strong>
                  <ul className="reason-list">
                    {aiWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="field-grid">
                <label className="field">
                  <span>Installed part number</span>
                  <input
                    value={installedPartNumber}
                    onChange={(event) =>
                      setInstalledPartNumber(event.target.value)
                    }
                    placeholder="e.g. X77XY"
                    autoComplete="off"
                  />
                  <small>
                    From the battery label or the battery report’s “Name” line.
                  </small>
                </label>
                <label className="field">
                  <span>Design capacity (mWh)</span>
                  <input
                    value={designCapacityMwh}
                    onChange={(event) =>
                      setDesignCapacityMwh(event.target.value)
                    }
                    inputMode="numeric"
                    placeholder="68005"
                  />
                </label>
                <label className="field">
                  <span>Full charge capacity (mWh)</span>
                  <input
                    value={fullChargeCapacityMwh}
                    onChange={(event) =>
                      setFullChargeCapacityMwh(event.target.value)
                    }
                    inputMode="numeric"
                    placeholder="46907"
                  />
                </label>
              </div>

              <p className="hint">
                Windows: run <code>powercfg /batteryreport</code>, open the HTML
                report, and use the “Installed batteries” section. Do not upload
                the serial number or usage history.{" "}
                <a
                  className="inline-link"
                  href="https://www.dell.com/support/contents/en-us/article/product-support/self-support-knowledgebase/battery-and-power/battery"
                  target="_blank"
                  rel="noreferrer"
                >
                  Dell battery health guidance ↗
                </a>
              </p>

              <div className="button-row">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setStep(0)}
                >
                  Back
                </button>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={
                    !installedPartNumber.trim() ||
                    !Number(designCapacityMwh) ||
                    !Number(fullChargeCapacityMwh)
                  }
                >
                  Continue to symptoms
                </button>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="flow-card" aria-labelledby="symptom-heading">
              <div className="flow-card-head">
                <span className="pill">Step 3</span>
                <h2 id="symptom-heading">What is the laptop doing?</h2>
              </div>
              <fieldset className="chip-fieldset">
                <legend>Select all that apply</legend>
                <div className="chip-row">
                  {SYMPTOMS.map((symptom) => (
                    <label
                      key={symptom.tag}
                      className={`chip ${
                        symptomTags.includes(symptom.tag) ? "selected" : ""
                      } ${symptom.safety ? "chip-safety" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={symptomTags.includes(symptom.tag)}
                        onChange={() => toggleSymptom(symptom.tag)}
                      />
                      {symptom.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="field" style={{ marginTop: "1rem" }}>
                <span>Describe the symptom (optional)</span>
                <textarea
                  value={symptomText}
                  onChange={(event) => setSymptomText(event.target.value)}
                  rows={3}
                  placeholder="e.g. It runs for 30 seconds, then stops. The red light flashes."
                />
              </label>
              <div className="button-row">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => void handleParseSymptoms()}
                  disabled={aiBusy !== null || !symptomText.trim()}
                >
                  {aiBusy === "symptoms" ? "Reading…" : "Extract symptoms"}
                </button>
              </div>
              {aiBusy === "symptoms" ? (
                <div className="notice">Reading the symptom…</div>
              ) : null}
              {clarifyingQuestion ? (
                <div className="notice">
                  <strong>One question:</strong> {clarifyingQuestion}
                </div>
              ) : null}
              {aiMessage ? <p className="hint">{aiMessage}</p> : null}
              {aiWarnings.length > 0 ? (
                <div className="notice notice-warning">
                  <strong>Check these:</strong>
                  <ul className="reason-list">
                    {aiWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {symptomTags.includes("battery_damaged") ? (
                <div className="notice notice-danger">
                  <strong>Safety stop.</strong> A swollen, leaking, or
                  overheating lithium-ion battery is hazardous. Do not attempt
                  a DIY replacement. RepairLoop will not offer a checkout.
                </div>
              ) : (
                <p className="hint">
                  Symptoms help narrow the likely part category. They do not
                  replace a diagnosis; the catalog still decides fitment.
                </p>
              )}
              <div className="button-row">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => void runMatch()}
                  disabled={loading || symptomTags.length === 0}
                >
                  {loading ? "Checking the catalog…" : "Check compatibility"}
                </button>
              </div>
            </section>
          ) : null}

          {step === 3 && result ? (
            <section aria-labelledby="result-heading" aria-live="polite">
              <div className="flow-card-head result-head">
                <span className="pill">Step 4</span>
                <h2 id="result-heading">
                  {result.status === "verified_match"
                    ? "Verified replacement"
                    : result.status === "safety_stop"
                      ? "Stop — safety issue"
                      : "No verified match"}
                </h2>
              </div>

              <div className="result-meta">
                <div>
                  <span className="meta-label">Device</span>
                  <strong>
                    {result.model
                      ? `${result.model.brand} ${result.model.model}`
                      : selectedModel
                        ? `${selectedModel.brand} ${selectedModel.model}`
                        : "Unknown model"}
                  </strong>
                </div>
                <div>
                  <span className="meta-label">Installed part</span>
                  <strong>{installedPartNumber || "Not provided"}</strong>
                </div>
                <div>
                  <span className="meta-label">Battery health</span>
                  <strong>{healthLabel(result.healthPct)}</strong>
                </div>
              </div>

              {result.healthNote ? (
                <p className="hint">{result.healthNote}</p>
              ) : null}

              {result.status === "safety_stop" ? (
                <div className="notice notice-danger">
                  <strong>Safety stop.</strong>{" "}
                  {result.safety?.message ??
                    "A damaged battery can be hazardous. Seek professional service."}
                </div>
              ) : null}

              {result.status === "no_match" ? (
                <div className="notice notice-warning">
                  <strong>We will not guess.</strong>
                  <ul className="reason-list">
                    {result.reasons.map((reason) => (
                      <li key={reason}>{REASON_LABELS[reason] ?? reason}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.status === "verified_match" && result.exact ? (
                <div className="option-grid">
                  <OptionCard
                    option={result.exact}
                    source={sourceFor(result.exact.compatibility.sourceId)}
                    selected={selectedOption?.part.id === result.exact.part.id}
                    onChoose={() => chooseOption(result.exact!)}
                  />
                </div>
              ) : null}

              {result.lowerCapacity.length > 0 ? (
                <div className="subsection">
                  <h3>Lower-capacity options</h3>
                  <p className="hint">
                    These are verified for the model family but are not the
                    exact original for a 68Wh configuration.
                  </p>
                  <div className="option-grid">
                    {result.lowerCapacity.map((option) => (
                      <OptionCard
                        key={option.part.id}
                        option={option}
                        source={sourceFor(option.compatibility.sourceId)}
                        selected={selectedOption?.part.id === option.part.id}
                        onChoose={() => chooseOption(option)}
                        lower
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {result.excluded.length > 0 ? (
                <div className="subsection">
                  <h3>Not verified for your configuration</h3>
                  <div className="option-grid">
                    {result.excluded.map((excluded) => (
                      <article
                        className="option-card excluded"
                        key={excluded.part.id}
                      >
                        <div className="option-top">
                          <span className="badge-excluded">Not verified</span>
                          <span className="option-part">
                            {excluded.part.partNumber}
                          </span>
                        </div>
                        <h3>{excluded.part.name}</h3>
                        <p className="option-spec">
                          {excluded.part.capacityWh}Wh · {excluded.part.voltage}
                          V · {excluded.part.cells}-cell
                        </p>
                        <p className="option-reason">
                          {REASON_LABELS[excluded.reason] ?? excluded.reason}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="button-row result-actions">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  Edit details
                </button>
                {selectedOption ? (
                  <button
                    className="button primary"
                    type="button"
                    onClick={() => setStep(4)}
                  >
                    Review selected part
                  </button>
                ) : null}
                <button className="button ghost" type="button" onClick={reset}>
                  Start over
                </button>
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="flow-card" aria-labelledby="review-heading">
              <div className="flow-card-head">
                <span className="pill">Step 5</span>
                <h2 id="review-heading">Review the exact part</h2>
              </div>

              {!selectedOption ? (
                <div className="notice notice-warning">
                  Choose a verified part before reviewing it.
                  <div className="button-row">
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => setStep(3)}
                    >
                      Back to result
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="review-grid">
                    <div className="review-block">
                      <span className="meta-label">Device</span>
                      <strong>
                        {result?.model
                          ? `${result.model.brand} ${result.model.model}`
                          : selectedModel
                            ? `${selectedModel.brand} ${selectedModel.model}`
                            : "Dell Latitude 5400"}
                      </strong>
                      <span className="hint">
                        Installed: {installedPartNumber || "not provided"}
                      </span>
                    </div>
                    <div className="review-block">
                      <span className="meta-label">Selected replacement</span>
                      <strong>
                        {selectedOption.part.partNumber} ·{" "}
                        {selectedOption.part.name}
                      </strong>
                      <span className="hint">
                        {selectedOption.part.capacityWh}Wh ·{" "}
                        {selectedOption.part.voltage}V ·{" "}
                        {selectedOption.part.cells}-cell
                      </span>
                    </div>
                    <div className="review-block">
                      <span className="meta-label">Seller</span>
                      <strong>{selectedOption.part.seller}</strong>
                      <span className="hint">Sandbox demo seller</span>
                    </div>
                    <div className="review-block">
                      <span className="meta-label">Evidence</span>
                      {sourceFor(selectedOption.compatibility.sourceId) ? (
                        <a
                          className="source-link"
                          href={
                            sourceFor(selectedOption.compatibility.sourceId)!
                              .url
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          {
                            sourceFor(selectedOption.compatibility.sourceId)!
                              .publisher
                          }
                        </a>
                      ) : (
                        <strong>Source link unavailable</strong>
                      )}
                      <span className="hint">
                        Verified{" "}
                        {dateLabel(selectedOption.part.verifiedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="review-total">
                    <div>
                      <span>Item</span>
                      <strong>
                        {money(
                          selectedOption.part.priceDemo,
                          selectedOption.part.currency
                        )}
                      </strong>
                    </div>
                    <div>
                      <span>Shipping</span>
                      <strong>$0.00</strong>
                    </div>
                    <div>
                      <span>Tax</span>
                      <strong>$0.00</strong>
                    </div>
                    <div className="total-line">
                      <span>Total</span>
                      <strong>
                        {money(
                          selectedOption.part.priceDemo,
                          selectedOption.part.currency
                        )}
                      </strong>
                    </div>
                  </div>

                  {receipt ? (
                    <div className="receipt-success">
                      <div className="option-top">
                        <span className="badge-verified">
                          Payment complete — sandbox
                        </span>
                        <span className="option-part">
                          {receipt.partNumber}
                        </span>
                      </div>
                      <h3>Capture {receipt.captureId}</h3>
                      <p className="option-reason">{receipt.partName}</p>
                      <p className="option-price">
                        {money(receipt.amount, receipt.currency)} ·{" "}
                        {receipt.status}
                      </p>
                      <p className="hint">
                        Order {receipt.orderId}
                        {receipt.capturedAt
                          ? ` · ${new Date(
                              receipt.capturedAt
                            ).toLocaleString()}`
                          : ""}
                      </p>
                      {receipt.sourcePublisher ? (
                        <p className="hint">
                          Source:{" "}
                          {receipt.sourceUrl ? (
                            <a
                              className="source-link"
                              href={receipt.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {receipt.sourcePublisher} ↗
                            </a>
                          ) : (
                            receipt.sourcePublisher
                          )}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <div className="receipt-preview">
                        <div>
                          <span className="meta-label">Receipt preview</span>
                          <strong>Status: not paid</strong>
                        </div>
                        <div>
                          <span>Part</span>
                          <strong>{selectedOption.part.partNumber}</strong>
                        </div>
                        <div>
                          <span>Amount</span>
                          <strong>
                            {money(
                              selectedOption.part.priceDemo,
                              selectedOption.part.currency
                            )}
                          </strong>
                        </div>
                        <div>
                          <span>Source</span>
                          <strong>
                            {sourceFor(selectedOption.compatibility.sourceId)
                              ?.publisher ?? "unavailable"}
                          </strong>
                        </div>
                        <p className="hint">
                          Payment has not started. The sandbox capture ID will
                          appear after PayPal confirms the capture.
                        </p>
                      </div>

                      {orderPayload ? (
                        <PayPalCheckout
                          payload={orderPayload}
                          amountLabel={money(
                            selectedOption.part.priceDemo,
                            selectedOption.part.currency
                          )}
                          onCaptured={setReceipt}
                        />
                      ) : null}
                    </>
                  )}

                  <div className="button-row">
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => setStep(3)}
                    >
                      Back to result
                    </button>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={reset}
                    >
                      Start over
                    </button>
                  </div>
                </>
              )}

              <div className="repair-card">
                <div>
                  <span className="meta-label">Repair card</span>
                  <strong>
                    {result?.model?.model ?? "Dell Latitude 5400"} ·{" "}
                    {selectedOption?.part.partNumber ?? "No part selected"}
                  </strong>
                  <p className="hint">
                    Keep the verified part number with the device. Check the
                    warranty before opening the laptop.
                  </p>
                </div>
                <div className="guide-links">
                  {REPAIR_GUIDES.map((guide) => (
                    <a
                      key={guide.href}
                      href={guide.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {guide.label} ↗
                    </a>
                  ))}
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() => window.print()}
                  >
                    Print / save repair card
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <footer className="footer">
          <p>
            RepairLoop is a hackathon prototype. Sandbox only. Dell is a
            trademark of Dell Inc.; RepairLoop is not affiliated with or
            endorsed by Dell.
          </p>
          <span>Repair the right thing, with the right part.</span>
        </footer>
      </div>
    </main>
  );
}

function OptionCard({
  option,
  source,
  selected,
  onChoose,
  lower = false
}: {
  option: MatchOption;
  source?: Source;
  selected: boolean;
  onChoose: () => void;
  lower?: boolean;
}) {
  return (
    <article className={`option-card ${selected ? "selected" : ""}`}>
      <div className="option-top">
        <span className={lower ? "badge-lower" : "badge-verified"}>
          {lower ? "Lower capacity" : "Verified exact match"}
        </span>
        <span className="option-part">{option.part.partNumber}</span>
      </div>
      <h3>{option.part.name}</h3>
      <p className="option-spec">
        {option.part.capacityWh}Wh · {option.part.voltage}V ·{" "}
        {option.part.cells}-cell
      </p>
      <p className="option-reason">{option.reason}</p>
      <p className="option-price">
        {money(option.part.priceDemo, option.part.currency)}{" "}
        <span className="hint">· {option.part.seller}</span>
      </p>
      <div className="source-line">
        {source ? (
          <a href={source.url} target="_blank" rel="noreferrer">
            {source.publisher} source ↗
          </a>
        ) : (
          <span>Source link unavailable</span>
        )}
        <span>Verified {dateLabel(option.part.verifiedAt)}</span>
      </div>
      <div className="button-row">
        <button className="button primary" type="button" onClick={onChoose}>
          {lower ? "Choose lower-capacity option" : "Review this part"}
        </button>
      </div>
    </article>
  );
}
