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
};

type CatalogData = {
  models: CatalogModel[];
  parts: CatalogPart[];
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
  const usedSourceIds = new Set(data?.parts.map((part) => part.sourceId));
  const sources =
    data?.sources.filter((source) => usedSourceIds.has(source.id)) ?? [];

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
                verified-at date. The 15.2V 68Wh variant is shown only to
                explain why it is excluded.
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
                <span className="meta-label">Supported models</span>
                <div className="catalog-models">
                  {data.models.map((model) => (
                    <span className="catalog-model" key={model.id}>
                      {model.model}
                    </span>
                  ))}
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
            <p>
              RepairLoop is a hackathon prototype. Prices are sandbox demo
              values. Dell is a trademark of Dell Inc.; RepairLoop is not
              affiliated with or endorsed by Dell.
            </p>
            <span>Repair the right thing, with the right part.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
