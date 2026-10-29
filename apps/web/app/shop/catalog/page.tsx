"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { apiBaseUrl } from "../../lib/api";
import {
  buildMatrixRows,
  type CatalogData
} from "../../lib/catalog";

const CompatibilityGrid = dynamic(
  () =>
    import("./CompatibilityGrid").then((module) => module.CompatibilityGrid),
  {
    ssr: false,
    loading: () => (
      <div className="flow-card">Loading the compatibility grid…</div>
    )
  }
);

export default function ShopCatalogPage() {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
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
        const data = (await response.json()) as CatalogData;
        if (!cancelled) setCatalog(data);
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

  const rows = useMemo(
    () => (catalog ? buildMatrixRows(catalog) : []),
    [catalog]
  );
  const verifiedParts =
    catalog?.parts.filter((part) => part.status === "verified").length ?? 0;

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
            <Link className="nav-link" href="/shop">
              Shop intake
            </Link>
            <Link className="nav-link" href="/catalog">
              Catalog
            </Link>
            <span className="badge">Shop matrix</span>
          </div>
        </nav>

        <div className="check-shell">
          <div className="check-head">
            <div>
              <p className="eyebrow">Shop reference · AG Grid</p>
              <h1 className="check-title">Source-linked compatibility matrix.</h1>
              <p className="lede">
                Filter verified battery families by model, part, capacity,
                voltage, source, and point-in-time seller availability. Select
                a row to inspect the fitment evidence, then send a verified
                request into the human-reviewed shop quote flow.
              </p>
            </div>
            <div className="check-actions">
              <Link className="button primary" href="/shop">
                Start a shop quote
              </Link>
            </div>
          </div>

          <div className="matrix-kpis">
            <div>
              <span className="meta-label">Models</span>
              <strong>{catalog?.models.length ?? "—"}</strong>
            </div>
            <div>
              <span className="meta-label">Parts</span>
              <strong>{catalog?.parts.length ?? "—"}</strong>
            </div>
            <div>
              <span className="meta-label">Fitment rows</span>
              <strong>{rows.length}</strong>
            </div>
            <div>
              <span className="meta-label">Verified parts</span>
              <strong>{verifiedParts}</strong>
            </div>
          </div>

          <div className="flow-card">
            {loading ? (
              <p>Loading the source-linked matrix…</p>
            ) : error ? (
              <div className="notice notice-danger">
                {error}{" "}
                <Link className="inline-link" href="/shop">
                  Go to shop intake
                </Link>
              </div>
            ) : catalog ? (
              <CompatibilityGrid rows={rows} />
            ) : null}
          </div>

          <p className="hint">
            No live inventory, shipping, fulfillment, or warranty is claimed.
            The matrix is a reference; the shop intake still requires AI
            consent, human review, and the normal approval gate.
          </p>
        </div>

        <footer className="footer">
          <div>
            <p>
              RepairLoop is a hackathon prototype. Sandbox only. Dell and Lenovo
              are trademarks of their respective owners; RepairLoop is not
              affiliated with or endorsed by either company.
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
    </main>
  );
}
