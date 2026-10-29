"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiBaseUrl } from "../lib/api";

type CatalogPart = {
  id: string;
  name: string;
  partNumber: string;
  altPartNumbers: string[];
  capacityWh: number;
  voltage: string;
  cells: number;
  seller: string;
  priceDemo: string;
  currency: string;
  status: string;
  sourceId: string;
  verifiedAt: string | null;
  notes: string;
  availability?: "reported_in_stock" | "reported_out_of_stock" | "unknown";
  availabilityCheckedAt?: string | null;
  availabilityNote?: string | null;
  availabilitySourceUrl?: string | null;
};

type CatalogCompatibility = {
  id: string;
  modelId: string;
  partId: string;
  fitmentNote: string;
  sourceId: string;
  evidenceQuote: string | null;
  status: string;
  verifiedAt: string | null;
};

type CatalogSource = {
  id: string;
  publisher: string;
  url: string;
  accessedAt: string;
  licenseTerms: string;
  notes: string;
};

type CatalogModel = {
  id: string;
  brand: string;
  family: string;
  model: string;
  sourceId?: string | null;
};

type CatalogData = {
  models: CatalogModel[];
  parts: CatalogPart[];
  compatibility: CatalogCompatibility[];
  sources: CatalogSource[];
};

function money(value: string, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value));
}

function date(value: string | null): string {
  if (!value) return "not verified";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function CatalogPage() {
  const [data, setData] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/catalog`, {
          cache: "no-store"
        });
        if (!response.ok) {
          throw new Error(`Could not load the catalog (${response.status}).`);
        }
        const catalog = (await response.json()) as CatalogData;
        if (!cancelled) setData(catalog);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load the catalog."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceFor = (sourceId: string) =>
    data?.sources.find((source) => source.id === sourceId);

  const verified = data?.parts.filter((part) => part.status === "verified") ?? [];
  const excluded = data?.parts.filter((part) => part.status !== "verified") ?? [];
  const sources = data?.sources ?? [];
  const modelFor = (modelId: string) =>
    data?.models.find((model) => model.id === modelId);
  const compatibilityFor = (partId: string) =>
    (data?.compatibility ?? []).filter((row) => row.partId === partId);
  const availabilityLabel = (
    status: CatalogPart["availability"] = "unknown"
  ) =>
    status === "reported_in_stock"
      ? "Seller reported in stock"
      : status === "reported_out_of_stock"
        ? "Seller reported out of stock"
        : "Seller stock not verified";

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
              Check a device
            </Link>
            <Link className="nav-link" href="/shop">
              Shop mode
            </Link>
            <span className="badge">Source-linked</span>
          </div>
        </nav>

        <div className="check-shell">
          <div className="check-head">
            <div>
              <p className="eyebrow">Source-linked catalog</p>
              <h1 className="check-title">No source, no recommendation.</h1>
              <p className="lede">
                Every part below has a catalog source, a fitment note, and a
                verified-at date. Model aliases and fitment rows have their own
                sources. Seller stock/price are point-in-time reports, not live
                inventory. The 15.2V 68Wh variant is shown only to explain why
                it is excluded.
              </p>
            </div>
            <div className="check-actions">
              <Link className="button primary" href="/check">
                Check my battery
              </Link>
            </div>
          </div>

          <div className="flow-card">
            {loading ? (
              <p>Loading the verified catalog…</p>
            ) : error ? (
              <div className="notice notice-danger">{error}</div>
            ) : data ? (
              <>
                <span className="meta-label">Supported models ({data.models.length})</span>
                <div className="catalog-models">
                  {data.models.map((model) => {
                    const modelSource = model.sourceId
                      ? sourceFor(model.sourceId)
                      : undefined;
                    return (
                      <span className="catalog-model" key={model.id}>
                        {model.model}
                        {modelSource ? (
                          <a
                            className="source-link"
                            href={modelSource.url}
                            target="_blank"
                            rel="noreferrer"
                            title={`Model source: ${modelSource.publisher}`}
                          >
                            {" "}
                            source ↗
                          </a>
                        ) : null}
                      </span>
                    );
                  })}
                </div>

                <div className="catalog-section">
                  <h2>Verified replacements</h2>
                  <div className="catalog-grid">
                    {verified.map((part) => {
                      const source = sourceFor(part.sourceId);
                      return (
                        <article className="option-card" key={part.id}>
                          <div className="option-top">
                            <span className="option-part">
                              {part.partNumber}
                            </span>
                            <span className="badge-verified">verified</span>
                          </div>
                          <h3>{part.name}</h3>
                          <p className="option-spec">
                            {part.capacityWh}Wh · {part.voltage}V ·{" "}
                            {part.cells}-cell · also{" "}
                            {part.altPartNumbers.slice(0, 3).join(", ")}
                          </p>
                          <p className="option-price">
                            {money(part.priceDemo, part.currency)}{" "}
                            <span className="hint">demo price</span>
                          </p>
                          <p className="hint">
                            <strong>{availabilityLabel(part.availability)}</strong>
                            {part.availabilityNote
                              ? ` · ${part.availabilityNote}`
                              : ""}
                          </p>
                          <p className="catalog-notes">{part.notes}</p>
                          <div className="fitment-list">
                            <span className="meta-label">Fitment evidence</span>
                            {compatibilityFor(part.id).map((row) => {
                              const compatibilitySource = sourceFor(row.sourceId);
                              const model = modelFor(row.modelId);
                              return (
                                <p className="hint" key={row.id}>
                                  <strong>{model?.model ?? row.modelId}</strong>:{" "}
                                  {row.fitmentNote}{" "}
                                  {compatibilitySource ? (
                                    <a
                                      className="source-link"
                                      href={compatibilitySource.url}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      {compatibilitySource.publisher} ↗
                                    </a>
                                  ) : null}
                                  {row.evidenceQuote ? (
                                    <span> “{row.evidenceQuote}”</span>
                                  ) : null}
                                </p>
                              );
                            })}
                          </div>
                          <div className="source-line">
                            <span>
                              {source ? (
                                <a
                                  className="source-link"
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {source.publisher} ↗
                                </a>
                              ) : (
                                "Source unavailable"
                              )}
                            </span>
                            <span>Verified {date(part.verifiedAt)}</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                {excluded.length > 0 ? (
                  <div className="catalog-section">
                    <h2>Explicitly excluded</h2>
                    <div className="catalog-grid">
                      {excluded.map((part) => {
                        const source = sourceFor(part.sourceId);
                        return (
                          <article
                            className="option-card excluded"
                            key={part.id}
                          >
                            <div className="option-top">
                              <span className="option-part">
                                {part.partNumber}
                              </span>
                              <span className="badge-excluded">
                                not verified
                              </span>
                            </div>
                            <h3>{part.name}</h3>
                            <p className="option-spec">
                              {part.capacityWh}Wh · {part.voltage}V ·{" "}
                              {part.cells}-cell
                            </p>
                            <p className="hint">
                              <strong>{availabilityLabel(part.availability)}</strong>
                              {part.availabilityNote
                                ? ` · ${part.availabilityNote}`
                                : ""}
                            </p>
                            <p className="catalog-notes">{part.notes}</p>
                            <div className="source-line">
                              <span>
                                {source ? (
                                  <a
                                    className="source-link"
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {source.publisher} ↗
                                  </a>
                                ) : (
                                  "Source unavailable"
                                )}
                              </span>
                              <span>No checkout</span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="catalog-section">
                  <h2>Source freshness</h2>
                  <p className="hint">
                    All catalog, model, fitment, and health references are shown;
                    a source used by one part is not evidence for another.
                  </p>
                  <div className="catalog-source-list">
                    {sources.map((source) => (
                      <div className="catalog-source-item" key={source.id}>
                        <div className="option-top">
                          <a
                            className="source-link"
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {source.publisher} ↗
                          </a>
                          <span className="hint">
                            Accessed {date(source.accessedAt)}
                          </span>
                        </div>
                        <p className="catalog-notes">{source.notes}</p>
                        <p className="hint">{source.licenseTerms}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="hint">
                  Demo prices are sandbox values. Catalog facts are attributed
                  to the linked source; the part still needs to match the exact
                  device configuration. No verified source means no checkout.
                </p>
              </>
            ) : null}

            <div className="button-row">
              <Link className="button primary" href="/check">
                Check another device
              </Link>
              <Link className="button ghost" href="/">
                Back to home
              </Link>
            </div>
          </div>

          <footer className="footer">
            <div>
              <p>
                RepairLoop is a hackathon prototype. Prices are sandbox demo
                values. Dell and Lenovo are trademarks of their respective owners; RepairLoop is
                not affiliated with or endorsed by either company.
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
