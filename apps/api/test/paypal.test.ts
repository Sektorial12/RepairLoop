import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isCompletedOrder } from "../src/routes/checkout.js";

type FetchCall = [string, RequestInit];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("PayPal client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("PAYPAL_CLIENT_ID", "test-client");
    vi.stubEnv("PAYPAL_CLIENT_SECRET", "test-secret");
    vi.stubEnv("PAYPAL_API_BASE", "https://api-m.sandbox.paypal.com");
    vi.stubEnv("PAYPAL_WEBHOOK_ID", "test-webhook");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("authenticates and sends a server-priced order with idempotency", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "token", expires_in: 3600 })
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: "ORDER-1", status: "CREATED" })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { createPayPalOrder } = await import("../src/paypal/client.js");
    const result = await createPayPalOrder({
      amount: "109.95",
      currency: "USD",
      description: "Dell 68Wh battery — 4GVMP",
      customId: "case-1|part-4gvmp-68wh",
      referenceId: "part-4gvmp-68wh",
      requestId: "repairloop-case-1",
      returnUrl: "https://example.com/check?paypal=return",
      cancelUrl: "https://example.com/check?paypal=cancel"
    });

    expect(result.id).toBe("ORDER-1");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [oauthUrl, oauthInit] = fetchMock.mock.calls[0] as FetchCall;
    expect(oauthUrl).toBe("https://api-m.sandbox.paypal.com/v1/oauth2/token");
    expect(oauthInit.method).toBe("POST");
    expect(oauthInit.headers).toMatchObject({
      Authorization: `Basic ${Buffer.from("test-client:test-secret").toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    });
    expect(oauthInit.body).toBe("grant_type=client_credentials");

    const [orderUrl, orderInit] = fetchMock.mock.calls[1] as FetchCall;
    expect(orderUrl).toBe(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders"
    );
    expect(orderInit.method).toBe("POST");
    expect(orderInit.headers).toMatchObject({
      Authorization: "Bearer token",
      "PayPal-Request-Id": "repairloop-case-1"
    });

    const payload = JSON.parse(String(orderInit.body));
    expect(payload.intent).toBe("CAPTURE");
    expect(payload.purchase_units[0]).toMatchObject({
      reference_id: "part-4gvmp-68wh",
      custom_id: "case-1|part-4gvmp-68wh"
    });
    expect(payload.purchase_units[0].amount).toMatchObject({
      currency_code: "USD",
      value: "109.95"
    });
    expect(payload.purchase_units[0].items[0].unit_amount.value).toBe(
      "109.95"
    );
    expect(payload.application_context).toMatchObject({
      shipping_preference: "NO_SHIPPING",
      return_url: "https://example.com/check?paypal=return",
      cancel_url: "https://example.com/check?paypal=cancel"
    });
  });

  it("maps a PayPal network timeout to an upstream error", async () => {
    const timeoutError = Object.assign(new Error("timed out"), {
      name: "TimeoutError"
    });
    const fetchMock = vi.fn().mockRejectedValue(timeoutError);
    vi.stubGlobal("fetch", fetchMock);

    const { createPayPalOrder, PayPalError } = await import(
      "../src/paypal/client.js"
    );

    await expect(
      createPayPalOrder({
        amount: "109.95",
        currency: "USD",
        description: "Dell 68Wh battery — 4GVMP",
        customId: "case-1|part-4gvmp-68wh",
        referenceId: "part-4gvmp-68wh",
        requestId: "repairloop-case-1"
      })
    ).rejects.toMatchObject({
      kind: "upstream",
      message: "PayPal request timed out"
    });
    await expect(
      createPayPalOrder({
        amount: "109.95",
        currency: "USD",
        description: "Dell 68Wh battery — 4GVMP",
        customId: "case-1|part-4gvmp-68wh",
        referenceId: "part-4gvmp-68wh",
        requestId: "repairloop-case-1"
      })
    ).rejects.toBeInstanceOf(PayPalError);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("sends the capture request with its own idempotency key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "token", expires_in: 3600 })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "ORDER-1",
          status: "COMPLETED",
          purchase_units: [
            {
              payments: {
                captures: [
                  {
                    id: "CAP-1",
                    status: "COMPLETED",
                    amount: { value: "109.95", currency_code: "USD" }
                  }
                ]
              }
            }
          ]
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { capturePayPalOrder } = await import("../src/paypal/client.js");
    const result = await capturePayPalOrder("ORDER-1", "repairloop-capture-1");
    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];

    expect(capture?.id).toBe("CAP-1");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [captureUrl, captureInit] = fetchMock.mock.calls[1] as FetchCall;
    expect(captureUrl).toBe(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders/ORDER-1/capture"
    );
    expect(captureInit.method).toBe("POST");
    expect(captureInit.headers).toMatchObject({
      Authorization: "Bearer token",
      "PayPal-Request-Id": "repairloop-capture-1"
    });
  });

  it("accepts only a fully completed capture", async () => {
    const { isCompletedCapture } = await import("../src/paypal/client.js");
    const response = { id: "ORDER-1", status: "COMPLETED" };
    const capture = {
      id: "CAP-1",
      status: "COMPLETED",
      amount: { value: "109.95", currency_code: "USD" }
    };

    expect(isCompletedCapture(response, capture)).toBe(true);
    expect(isCompletedCapture({ ...response, status: "PENDING" }, capture)).toBe(
      false
    );
    expect(
      isCompletedCapture(response, { ...capture, status: "PENDING" })
    ).toBe(false);
    expect(isCompletedCapture(response, undefined)).toBe(false);
  });

  it("treats a captured completed order as the duplicate guard", () => {
    expect(
      isCompletedOrder({ status: "completed", paypalCaptureId: "CAP-1" })
    ).toBe(true);
    expect(
      isCompletedOrder({ status: "completed", paypalCaptureId: null })
    ).toBe(false);
    expect(
      isCompletedOrder({ status: "created", paypalCaptureId: null })
    ).toBe(false);
  });

  it("rejects a capture whose amount or currency differs from the order", async () => {
    const { captureMatchesOrder } = await import("../src/paypal/client.js");
    const capture = {
      id: "CAP-1",
      status: "COMPLETED",
      amount: { value: "109.95", currency_code: "USD" }
    };

    expect(
      captureMatchesOrder({ amount: "109.95", currency: "USD" }, capture)
    ).toBe(true);
    expect(
      captureMatchesOrder({ amount: "1.00", currency: "USD" }, capture)
    ).toBe(false);
    expect(
      captureMatchesOrder({ amount: "109.95", currency: "EUR" }, capture)
    ).toBe(false);
    expect(
      captureMatchesOrder({ amount: null, currency: "USD" }, capture)
    ).toBe(true);
  });
});
