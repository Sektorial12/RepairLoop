"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiBaseUrl } from "../../lib/api";

type ReceiptData = {
  order: {
    id: string;
    paypalOrderId: string;
    captureId: string | null;
    amount: string | null;
    currency: string;
    status: string;
    createdAt: string;
  };
  part: {
    partNumber: string;
    name: string;
    seller: string | null;
    sourcePublisher: string | null;
    sourceUrl: string | null;
  } | null;
  events: Array<{
    id: string;
    eventType: string;
    verified: boolean;
    createdAt: string;
  }>;
};

function money(value: string | null, currency: string): string {
  if (!value) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value));
}

export default function ReceiptPage() {
  const params = useParams<{ orderId: string | string[] }>();
  const rawOrderId = params.orderId;
  const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/orders/${encodeURIComponent(orderId)}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "This sandbox order was not found."
              : `Could not load the receipt (${response.status}).`
          );
        }
        const receipt = (await response.json()) as ReceiptData;
        if (!cancelled) setData(receipt);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load the receipt."
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
  }, [orderId]);

  return (
    <main>
      <div className="shell">
        <nav className="nav">
          <Link className="brand" href="/">
            <span className="brand-mark">R</span>
            <span>RepairLoop</span>
          </Link>
          <div className="nav-actions">
            <Link className="nav-link" href="/catalog">
              Catalog
            </Link>
            <Link className="nav-link" href="/shop">
              Shop mode
            </Link>
            <span className="badge">Sandbox receipt</span>
          </div>
        </nav>

        <div className="check-shell">
          <div className="check-head">
            <div>
              <p className="eyebrow">Shared receipt</p>
              <h1 className="check-title">Verified repair payment.</h1>
              <p className="lede">
                A sandbox PayPal payment tied to the exact verified part and
                its catalog evidence.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flow-card">Loading receipt…</div>
          ) : error ? (
            <div className="flow-card">
              <div className="notice notice-danger">{error}</div>
              <div className="button-row">
                <Link className="button primary" href="/check">
                  Open the check flow
                </Link>
              </div>
            </div>
          ) : data ? (
            <div className="flow-card">
              <div className="receipt-success">
                <div className="option-top">
                  <span
                    className={
                      data.order.status === "completed"
                        ? "badge-verified"
                        : "badge-lower"
                    }
                  >
                    {data.order.status === "completed"
                      ? "Payment complete — sandbox"
                      : `Status: ${data.order.status}`}
                  </span>
                  <span className="option-part">
                    {data.part?.partNumber ?? "Part unavailable"}
                  </span>
                </div>
                <h3>
                  {data.order.captureId
                    ? `Capture ${data.order.captureId}`
                    : "No capture recorded"}
                </h3>
                <p className="option-reason">
                  {data.part?.name ?? "Part details unavailable"}
                </p>
                <p className="option-price">
                  {money(data.order.amount, data.order.currency)} ·{" "}
                  {data.order.status.toUpperCase()}
                </p>
                {data.part?.seller ? (
                  <p className="hint">
                    Seller (sandbox demo): {data.part.seller}
                  </p>
                ) : null}
                <p className="hint">
                  Order {data.order.paypalOrderId} ·{" "}
                  {new Date(data.order.createdAt).toLocaleString()}
                </p>
                {data.part?.sourcePublisher ? (
                  <p className="hint">
                    Source:{" "}
                    {data.part.sourceUrl ? (
                      <a
                        className="source-link"
                        href={data.part.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {data.part.sourcePublisher} ↗
                      </a>
                    ) : (
                      data.part.sourcePublisher
                    )}
                  </p>
                ) : null}

                {data.events.length > 0 ? (
                  <div className="event-log">
                    <span className="meta-label">Payment events</span>
                    <ul className="event-list">
                      {data.events.map((event) => (
                        <li key={event.id}>
                          <span
                            className={
                              event.verified
                                ? "badge-verified"
                                : "badge-excluded"
                            }
                          >
                            {event.verified ? "verified" : "unverified"}
                          </span>
                          <span className="event-type">{event.eventType}</span>
                          <span className="hint">
                            {new Date(event.createdAt).toLocaleTimeString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <p className="hint">
                Compatibility is verified by the source-linked catalog. PayPal
                completes the payment; it does not verify the part. Sandbox
                only — no real money moved. This shared receipt is read-only;
                capture retry is available only from the checkout session that
                created the order.
              </p>

              <div className="button-row">
                <Link className="button primary" href="/check">
                  Check another device
                </Link>
                <Link className="button ghost" href="/">
                  Back to home
                </Link>
              </div>
            </div>
          ) : null}

          <footer className="footer">
            <div>
              <p>
                RepairLoop is a hackathon prototype. Dell and Lenovo are trademarks of their respective owners; RepairLoop is
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
