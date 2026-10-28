"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiBaseUrl } from "../lib/api";

type Extraction = {
  modelQuery: string | null;
  installedPartNumber: string | null;
  designCapacityMwh: number | null;
  fullChargeCapacityMwh: number | null;
  symptomTags: string[];
  clarifyingQuestion: string | null;
  safetyFlag: boolean;
  confidence: number;
  warnings: string[];
};

type ShopQuote = {
  partId: string;
  partNumber: string;
  name: string;
  amount: string;
  currency: string;
  seller: string;
  sourcePublisher: string | null;
  sourceUrl: string | null;
  sellerUrl: string | null;
  fitmentNote: string;
  verifiedAt: string | null;
};

type ShopIntakeDraft = {
  ok: boolean;
  extraction: Extraction;
  match: {
    status: "verified_match" | "no_match" | "safety_stop";
    model: {
      id: string;
      brand: string;
      model: string;
    } | null;
    installedPart: { partNumber: string } | null;
    healthPct: number | null;
    healthNote: string | null;
    exact: { part: { partNumber: string } } | null;
    lowerCapacity: Array<{ part: { partNumber: string } }>;
    excluded: Array<{ part: { partNumber: string }; reason: string }>;
    reasons: string[];
    safety: { message: string } | null;
  };
  quote: ShopQuote | null;
  sellerUrl: string | null;
};

type RepairCase = {
  id: string;
  modelId: string | null;
  installedPartNumber: string | null;
  healthPct: string | null;
  symptomTags: string[];
  createdAt: string;
  selectedPart: {
    partNumber: string;
    name: string;
    seller: string;
    priceDemo: string;
    currency: string;
    sourcePublisher: string | null;
    sourceUrl: string | null;
  } | null;
};

const REASON_LABELS: Record<string, string> = {
  unsupported_model: "This model is not in the verified catalog yet.",
  unknown_installed_part: "The installed part could not be identified.",
  missing_identity: "Add the model and installed part number.",
  unknown_capacity: "The reported capacity did not match a known part.",
  no_catalog_for_model: "There is no verified catalog for this model.",
  no_verified_replacement: "No exact replacement could be verified.",
  voltage_mismatch: "Different voltage — not verified.",
  different_capacity: "Different capacity — not exact.",
  higher_capacity_not_exact: "Higher capacity — not exact.",
  unverified_for_configuration: "Not verified for this configuration."
};

function money(value: string, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value));
}

export default function ShopPage() {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<ShopIntakeDraft | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [queue, setQueue] = useState<RepairCase[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/repair-cases`, {
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`Queue returned ${response.status}`);
      const data = (await response.json()) as { cases: RepairCase[] };
      setQueue(data.cases);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load the queue."
      );
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const runIntake = async () => {
    if (!text.trim()) return;
    setDrafting(true);
    setError(null);
    setDraft(null);
    setAdded(false);

    try {
      const response = await fetch(`${apiBaseUrl}/api/shop/intake`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text })
      });
      const body = (await response.json().catch(() => null)) as
        | ShopIntakeDraft
        | { error?: string; message?: string }
        | null;
      if (!response.ok || !body || !("ok" in body)) {
        throw new Error(
          (body as { message?: string; error?: string } | null)?.message ??
            (body as { error?: string } | null)?.error ??
            `Intake returned ${response.status}.`
        );
      }
      setDraft(body as ShopIntakeDraft);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not draft the quote."
      );
    } finally {
      setDrafting(false);
    }
  };

  const addToQueue = async () => {
    if (!draft?.quote || !draft.match.model) return;
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/repair-cases`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          modelId: draft.match.model.id,
          installedPartNumber:
            draft.extraction.installedPartNumber ?? undefined,
          designCapacityMwh:
            draft.extraction.designCapacityMwh ?? undefined,
          fullChargeCapacityMwh:
            draft.extraction.fullChargeCapacityMwh ?? undefined,
          symptomTags: draft.extraction.symptomTags,
          partId: draft.quote.partId
        })
      });
      const body = (await response.json().catch(() => null)) as
        | { repairCaseId?: string; message?: string; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          body?.message ?? body?.error ?? `Queue add returned ${response.status}.`
        );
      }
      setAdded(true);
      await loadQueue();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not add the quote."
      );
    }
  };

  return (
    <main>
      <div className="shell">
        <nav className="nav">
          <Link className="brand" href="/">
            <span className="brand-mark">R</span>
            <span>RepairLoop</span>
          </Link>
          <div className="nav-actions">
            <Link className="nav-link" href="/check">
              Consumer check
            </Link>
            <Link className="nav-link" href="/catalog">
              Catalog
            </Link>
            <span className="badge">Shop mode</span>
          </div>
        </nav>

        <div className="check-shell">
          <div className="check-head">
            <div>
              <p className="eyebrow">For repair shops</p>
              <h1 className="check-title">Intake. Verify. Quote.</h1>
              <p className="lede">
                Paste a customer request. AI extracts the facts, the catalog
                verifies the exact part, and you approve the quote. AI never
                decides fitment or captures payment.
              </p>
            </div>
          </div>

          {error ? <div className="notice notice-danger">{error}</div> : null}

          <div className="shop-grid">
            <section className="flow-card" aria-labelledby="intake-heading">
              <div className="flow-card-head">
                <span className="pill">AI intake</span>
                <h2 id="intake-heading">Draft a verified quote</h2>
              </div>

              <label className="field">
                <span>Customer request</span>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={5}
                  placeholder="Example: Customer brought in a Dell Latitude 5410. The battery label says R8D7N; it dies after 20 minutes."
                />
                <small>
                  Do not paste serial numbers, names, addresses, or payment
                  data. The description is treated as untrusted input.
                </small>
              </label>
              <div className="button-row">
                <button
                  className="button primary"
                  type="button"
                  onClick={() => void runIntake()}
                  disabled={drafting || !text.trim()}
                >
                  {drafting ? "Drafting…" : "Draft verified quote"}
                </button>
              </div>

              {draft ? (
                <div className="shop-draft">
                  <div className="ai-steps">
                    <span>1 · AI extraction</span>
                    <span>2 · Catalog verification</span>
                    <span>3 · Human approval</span>
                  </div>
                  <p className="hint">
                    AI confidence: {Math.round(draft.extraction.confidence * 100)}%
                  </p>
                  {draft.extraction.clarifyingQuestion ? (
                    <div className="notice notice-warning">
                      <strong>Ask the customer:</strong>{" "}
                      {draft.extraction.clarifyingQuestion}
                    </div>
                  ) : null}
                  {draft.extraction.warnings.length > 0 ? (
                    <div className="notice notice-warning">
                      <strong>Check these:</strong>
                      <ul className="reason-list">
                        {draft.extraction.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {draft.match.status === "safety_stop" ? (
                    <div className="notice notice-danger">
                      <strong>Safety stop.</strong>{" "}
                      {draft.match.safety?.message ??
                        "Do not quote a DIY replacement for a damaged battery."}
                    </div>
                  ) : null}

                  {draft.match.status === "no_match" ? (
                    <div className="notice notice-warning">
                      <strong>We will not guess.</strong>
                      <ul className="reason-list">
                        {draft.match.reasons.map((reason) => (
                          <li key={reason}>
                            {REASON_LABELS[reason] ?? reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {draft.quote ? (
                    <article className="option-card selected">
                      <div className="option-top">
                        <span className="option-part">
                          {draft.quote.partNumber}
                        </span>
                        <span className="badge-verified">verified</span>
                      </div>
                      <h3>{draft.quote.name}</h3>
                      <p className="option-spec">
                        {draft.match.model
                          ? `${draft.match.model.brand} ${draft.match.model.model}`
                          : "Draft model"}{" "}
                        · {draft.match.healthPct !== null
                          ? `${draft.match.healthPct.toFixed(1)}% health`
                          : "health not reported"}
                      </p>
                      <p className="option-price">
                        {money(draft.quote.amount, draft.quote.currency)} ·{" "}
                        {draft.quote.seller}
                      </p>
                      <p className="option-reason">{draft.quote.fitmentNote}</p>
                      {draft.quote.sourcePublisher ? (
                        <div className="source-line">
                          <span>
                            {draft.quote.sourceUrl ? (
                              <a
                                className="source-link"
                                href={draft.quote.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {draft.quote.sourcePublisher} evidence ↗
                              </a>
                            ) : (
                              draft.quote.sourcePublisher
                            )}
                          </span>
                          {draft.quote.sellerUrl ? (
                            <a
                              className="source-link"
                              href={draft.quote.sellerUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Buy at seller ↗
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="button-row">
                        <button
                          className="button primary"
                          type="button"
                          onClick={() => void addToQueue()}
                          disabled={added}
                        >
                          {added
                            ? "Added to shop queue"
                            : "Approve and add to queue"}
                        </button>
                      </div>
                    </article>
                  ) : null}

                  {draft.match.lowerCapacity.length > 0 ? (
                    <p className="hint">
                      Lower-capacity verified options:{" "}
                      {draft.match.lowerCapacity
                        .map((option) => option.part.partNumber)
                        .join(", ")}
                      .
                    </p>
                  ) : null}
                  {draft.match.excluded.length > 0 ? (
                    <p className="hint">
                      Excluded:{" "}
                      {draft.match.excluded
                        .map(
                          (option) =>
                            `${option.part.partNumber} (${REASON_LABELS[option.reason] ?? option.reason})`
                        )
                        .join("; ")}
                      .
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="flow-card" aria-labelledby="queue-heading">
              <div className="flow-card-head">
                <span className="pill">Shop queue</span>
                <h2 id="queue-heading">Approved quotes</h2>
              </div>
              <p className="hint">
                Quotes are human-approved before they reach the queue. Payment
                and seller handoff are external; no inventory or fulfillment is
                claimed.
              </p>
              <div className="button-row">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => void loadQueue()}
                  disabled={queueLoading}
                >
                  Refresh queue
                </button>
              </div>

              {queueLoading ? (
                <p>Loading queue…</p>
              ) : queue.length === 0 ? (
                <p className="hint">No approved quotes yet.</p>
              ) : (
                <div className="shop-case-list">
                  {queue.map((item) => (
                    <article className="shop-case" key={item.id}>
                      <div className="shop-case-top">
                        <strong>{item.selectedPart?.partNumber ?? "Unknown part"}</strong>
                        <span className="hint">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="hint">
                        {item.selectedPart?.name ?? "Part unavailable"}
                      </p>
                      <p className="hint">
                        Installed: {item.installedPartNumber ?? "not supplied"} ·{" "}
                        {item.selectedPart
                          ? `${item.selectedPart.seller} · ${money(
                              item.selectedPart.priceDemo,
                              item.selectedPart.currency
                            )}`
                          : "seller unavailable"}
                      </p>
                      {item.selectedPart?.sourcePublisher ? (
                        <a
                          className="source-link"
                          href={item.selectedPart.sourceUrl ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Source: {item.selectedPart.sourcePublisher} ↗
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <footer className="footer">
            <div>
              <p>
                RepairLoop is a hackathon prototype. Shop-mode quotes are
                sandbox demonstrations; no real parts, inventory, shipping,
                returns, or warranty are offered.
              </p>
              <div className="footer-links">
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/ai-disclosure">AI disclosure</Link>
              </div>
            </div>
            <span>Repair the right thing, with the right part.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
