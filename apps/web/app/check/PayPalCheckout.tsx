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
  sourcePublisher: string | null;
  sourceUrl: string | null;
  capturedAt: string;
};

type PayPalSession = {
  start: (
    options: { presentationMode: "auto" },
    order: Promise<{ orderId: string }>
  ) => Promise<void>;
};

type PayPalSdk = {
  createInstance: (options: {
    clientId: string;
    components: string[];
    pageType: string;
  }) => Promise<{
    findEligibleMethods: (options: {
      currencyCode: string;
    }) => Promise<{ isEligible: (method: string) => boolean }>;
    createPayPalOneTimePaymentSession: (options: {
      onApprove: (data: { orderId: string }) => Promise<void>;
      onCancel?: () => void;
      onError?: (error: unknown) => void;
    }) => PayPalSession;
  }>;
};

declare global {
  interface Window {
    paypal?: PayPalSdk;
  }
}

function loadPayPalSdk(url: string): Promise<void> {
  if (window.paypal) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${url}"]`
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("PayPal SDK failed to load"))
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("PayPal SDK failed to load"));
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
    "loading" | "ready" | "paying" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<PayPalSession | null>(null);
  const repairCaseIdRef = useRef<string | null>(null);

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

      const sdkUrl =
        config.environment === "sandbox"
          ? "https://www.sandbox.paypal.com/web-sdk/v6/core"
          : "https://www.paypal.com/web-sdk/v6/core";

      await loadPayPalSdk(sdkUrl);

      if (!window.paypal) {
        throw new Error("PayPal SDK is unavailable.");
      }

      const sdk = await window.paypal.createInstance({
        clientId: config.clientId,
        components: ["paypal-payments"],
        pageType: "checkout"
      });

      const methods = await sdk.findEligibleMethods({
        currencyCode: config.currency
      });

      if (!methods.isEligible("paypal")) {
        throw new Error("PayPal is not eligible in this browser.");
      }

      const session = sdk.createPayPalOneTimePaymentSession({
        onApprove: async ({ orderId }) => {
          try {
            const response = await fetch(
              `${apiBaseUrl}/api/checkout/orders/${encodeURIComponent(
                orderId
              )}/capture`,
              { method: "POST" }
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
            setStatus("ready");
            setError(
              caught instanceof Error
                ? `${caught.message} Do not assume success; retry or check the order.`
                : "Payment was approved, but capture failed. Do not assume success."
            );
          }
        },
        onCancel: () => {
          setStatus("ready");
          setError("Payment cancelled. No charge.");
        },
        onError: () => {
          setStatus("ready");
          setError("PayPal could not complete the payment. No charge.");
        }
      });

      if (!cancelled) {
        sessionRef.current = session;
        setStatus("ready");
      }
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

  const createOrder = async (): Promise<{ orderId: string }> => {
    if (!repairCaseIdRef.current) {
      const caseResponse = await fetch(`${apiBaseUrl}/api/repair-cases`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

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
        body: JSON.stringify({ repairCaseId: repairCaseIdRef.current })
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

    const orderData = (await orderResponse.json()) as { orderId: string };
    return { orderId: orderData.orderId };
  };

  const handlePay = async () => {
    const session = sessionRef.current;
    if (!session) return;

    setStatus("paying");
    setError(null);

    try {
      await session.start({ presentationMode: "auto" }, createOrder());
    } catch (caught) {
      setStatus("ready");
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not open PayPal. Try again."
      );
    }
  };

  return (
    <div className="paypal-box">
      <button
        className="button primary"
        type="button"
        onClick={() => void handlePay()}
        disabled={status !== "ready"}
      >
        {status === "loading"
          ? "Loading PayPal…"
          : status === "paying"
            ? "Opening PayPal…"
            : `Pay ${amountLabel} with PayPal`}
      </button>
      <p className="hint">
        Sandbox only. The approval and capture are real PayPal Sandbox API
        calls; no real money moves.
      </p>
      {error ? (
        <div className="notice notice-danger" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}
