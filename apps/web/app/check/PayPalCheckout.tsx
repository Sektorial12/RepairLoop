"use client";

import { useEffect, useRef, useState } from "react";
import { apiBaseUrl } from "../lib/api";

export type OrderPayload = {
  modelId?: string;
  modelQuery?: string;
  installedPartNumber?: string;
  designCapacityMwh?: number;
  fullChargeCapacityMwh?: number;
  symptomTags: string[];
  partId: string;
};

export type Receipt = {
  orderId: string;
  captureId: string;
  status: string;
  amount: string;
  currency: string;
  partNumber: string;
  partName: string;
  seller?: string | null;
  sourcePublisher: string | null;
  sourceUrl: string | null;
  capturedAt: string;
};

type PayPalButtonsInstance = {
  render: (element: HTMLElement) => Promise<void>;
  isEligible?: () => boolean;
};

type PayPalSdk = {
  Buttons: (options: {
    style?: Record<string, string | number>;
    createOrder: () => Promise<string>;
    onApprove: (data: {
      orderID?: string;
      orderId?: string;
    }) => Promise<void>;
    onCancel?: () => void;
    onError?: (error: unknown) => void;
  }) => PayPalButtonsInstance;
};

declare global {
  interface Window {
    paypal?: PayPalSdk;
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}

function loadPayPalSdk(url: string): Promise<void> {
  if (window.paypal?.Buttons) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    "script[data-paypal-sdk]"
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("PayPal SDK load timed out"));
      }, 20000);
      const finish = () => {
        clearTimeout(timer);
        resolve();
      };
      const fail = () => {
        clearTimeout(timer);
        reject(new Error("PayPal SDK failed to load"));
      };
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", fail, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      script.remove();
      reject(new Error("PayPal SDK load timed out"));
    }, 20000);
    script.src = url;
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error("PayPal SDK failed to load"));
    };
    document.head.appendChild(script);
  });
}

export function PayPalCheckout({
  payload,
  amountLabel,
  onCaptured
}: {
  payload: OrderPayload;
  amountLabel: string;
  onCaptured: (receipt: Receipt) => void;
}) {
  const [status, setStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const repairCaseIdRef = useRef<string | null>(null);
  const forceNewOrderRef = useRef(false);
  const attemptIdRef = useRef<string>(globalThis.crypto.randomUUID());

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      const configResponse = await fetch(`${apiBaseUrl}/api/paypal/config`, {
        cache: "no-store"
      });

      if (!configResponse.ok) {
        throw new Error("PayPal is not configured on the server.");
      }

      const config = (await configResponse.json()) as {
        clientId: string;
        environment: "sandbox" | "live";
        currency: string;
      };

      const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
        config.clientId
      )}&currency=${encodeURIComponent(
        config.currency
      )}&intent=capture&components=buttons&disable-funding=card`;

      await withTimeout(
        loadPayPalSdk(sdkUrl),
        22000,
        "PayPal SDK load timed out"
      );

      if (!window.paypal?.Buttons) {
        throw new Error("PayPal Buttons are unavailable.");
      }

      const createOrder = async (): Promise<string> => {
        if (!repairCaseIdRef.current) {
          const caseResponse = await fetch(
            `${apiBaseUrl}/api/repair-cases`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload)
            }
          );

          if (!caseResponse.ok) {
            const body = (await caseResponse.json().catch(() => null)) as
              | { error?: string; message?: string }
              | null;
            throw new Error(
              body?.message ??
                body?.error ??
                "Could not prepare the repair case."
            );
          }

          const caseData = (await caseResponse.json()) as {
            repairCaseId: string;
          };
          repairCaseIdRef.current = caseData.repairCaseId;
        }

        const orderResponse = await fetch(
          `${apiBaseUrl}/api/checkout/orders`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              repairCaseId: repairCaseIdRef.current,
              forceNew: forceNewOrderRef.current,
              attemptId: attemptIdRef.current
            })
          }
        );

        if (!orderResponse.ok) {
          const body = (await orderResponse.json().catch(() => null)) as
            | { error?: string; message?: string }
            | null;
          throw new Error(
            body?.message ??
              body?.error ??
              "Could not create the PayPal order."
          );
        }

        const orderData = (await orderResponse.json()) as {
          orderId: string;
        };
        setLastOrderId(orderData.orderId);
        forceNewOrderRef.current = false;
        return orderData.orderId;
      };

      const buttons = window.paypal.Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "paypal",
          height: 45
        },
        createOrder,
        onApprove: async (data) => {
          const orderId = data.orderID ?? data.orderId;
          if (!orderId) {
            forceNewOrderRef.current = true;
            attemptIdRef.current = globalThis.crypto.randomUUID();
            setStatus("ready");
            setError("PayPal returned no order ID.");
            return;
          }
          setLastOrderId(orderId);

          try {
            const response = await fetch(
              `${apiBaseUrl}/api/checkout/orders/${encodeURIComponent(
                orderId
              )}/capture`,
              {
                method: "POST",
                signal: AbortSignal.timeout(30000)
              }
            );

            if (!response.ok) {
              const body = (await response.json().catch(() => null)) as
                | { error?: string; message?: string }
                | null;
              throw new Error(
                body?.message ??
                  body?.error ??
                  "PayPal capture did not complete."
              );
            }

            const receipt = (await response.json()) as Receipt;
            onCaptured(receipt);
          } catch (caught) {
            forceNewOrderRef.current = true;
            attemptIdRef.current = globalThis.crypto.randomUUID();
            setStatus("ready");
            setError(
              caught instanceof Error &&
                (caught.name === "TimeoutError" ||
                  caught.name === "AbortError")
                ? `Payment capture timed out. Order ${orderId}. Do not assume success; open the receipt or retry.`
                : caught instanceof Error
                  ? `${caught.message} Order ${orderId}. Do not assume success; open the receipt or retry.`
                  : `Payment was approved, but capture failed. Order ${orderId}. Do not assume success.`
            );
          }
        },
        onCancel: () => {
          forceNewOrderRef.current = true;
          attemptIdRef.current = globalThis.crypto.randomUUID();
          setStatus("ready");
          setError("Payment cancelled. No charge.");
        },
        onError: () => {
          forceNewOrderRef.current = true;
          attemptIdRef.current = globalThis.crypto.randomUUID();
          setStatus("ready");
          setError("PayPal could not complete the payment. No charge.");
        }
      });

      if (cancelled || !containerRef.current) return;
      await buttons.render(containerRef.current);
      if (!cancelled) setStatus("ready");
    };

    void setup().catch((caught) => {
      if (cancelled) return;
      setStatus("error");
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not initialize PayPal."
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="paypal-box">
      <p className="paypal-amount">
        {status === "loading"
          ? "Loading PayPal…"
          : `Pay ${amountLabel} with PayPal`}
      </p>
      <div ref={containerRef} className="paypal-button-container" />
      <p className="hint">
        Sandbox only. The approval and capture are real PayPal Sandbox API
        calls; no real money moves.
      </p>
      {error ? (
        <div className="notice notice-danger" role="alert">
          {error}
        </div>
      ) : null}
      {lastOrderId ? (
        <p className="hint">
          Order <code>{lastOrderId}</code> ·{" "}
          <a
            className="source-link"
            href={`/receipt/${encodeURIComponent(lastOrderId)}`}
          >
            Open receipt
          </a>
        </p>
      ) : null}
    </div>
  );
}
