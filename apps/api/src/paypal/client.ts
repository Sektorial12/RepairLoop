import crypto from "node:crypto";
import { env } from "../config.js";

export type PayPalErrorKind = "not_configured" | "upstream" | "invalid_state";

export class PayPalError extends Error {
  constructor(
    public readonly kind: PayPalErrorKind,
    message: string,
    public readonly status?: number,
    public readonly debugId?: string
  ) {
    super(message);
    this.name = "PayPalError";
  }
}

export interface PayPalPublicConfig {
  clientId: string;
  environment: "sandbox" | "live";
  currency: "USD";
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
  links?: Array<{
    href: string;
    rel: string;
    method?: string;
  }>;
}

export interface PayPalCapture {
  id: string;
  status: string;
  amount: {
    value: string;
    currency_code: string;
  };
  create_time?: string;
}

export interface PayPalCaptureResponse {
  id: string;
  status: string;
  purchase_units?: Array<{
    payments?: {
      captures?: PayPalCapture[];
    };
  }>;
  payer?: {
    payer_id?: string;
  };
}

interface HeaderMap {
  [key: string]: string | string[] | undefined;
}

let tokenCache: { token: string; expiresAt: number } | null = null;
const certCache = new Map<string, string>();

export function paypalConfigured(): boolean {
  return Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
}

function assertSandboxOnly(): void {
  if (env.DEMO_MODE && !env.PAYPAL_API_BASE.includes("sandbox")) {
    throw new PayPalError(
      "not_configured",
      "Live PayPal is disabled in demo mode"
    );
  }
}

export function getPayPalPublicConfig(): PayPalPublicConfig {
  if (!paypalConfigured() || !env.PAYPAL_CLIENT_ID) {
    throw new PayPalError("not_configured", "PayPal is not configured");
  }
  assertSandboxOnly();

  return {
    clientId: env.PAYPAL_CLIENT_ID,
    environment: env.PAYPAL_API_BASE.includes("sandbox") ? "sandbox" : "live",
    currency: "USD"
  };
}

async function paypalFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(20000)
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    ) {
      throw new PayPalError("upstream", "PayPal request timed out");
    }
    throw error;
  }
}

async function getAccessToken(): Promise<string> {
  if (!paypalConfigured()) {
    throw new PayPalError("not_configured", "PayPal is not configured");
  }
  assertSandboxOnly();

  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const credentials = Buffer.from(
    `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await paypalFetch(`${env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const text = await response.text();
  if (!response.ok) {
    throw new PayPalError(
      "upstream",
      `PayPal OAuth failed (${response.status})`,
      response.status
    );
  }

  let json: { access_token?: string; expires_in?: number };
  try {
    json = JSON.parse(text) as { access_token?: string; expires_in?: number };
  } catch {
    throw new PayPalError("upstream", "PayPal OAuth returned invalid JSON");
  }

  if (!json.access_token) {
    throw new PayPalError("upstream", "PayPal OAuth returned no token");
  }

  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 300) * 1000
  };

  return tokenCache.token;
}

async function paypalRequest<T>(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: string;
    headers?: Record<string, string>;
  },
  token: string
): Promise<T> {
  const response = await paypalFetch(`${env.PAYPAL_API_BASE}${path}`, {
    method: init.method,
    body: init.body,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Keep the status-based error below.
  }

  if (!response.ok) {
    const value = json as
      | { debug_id?: string; details?: Array<{ issue?: string }> }
      | null;
    throw new PayPalError(
      "upstream",
      `PayPal request failed (${response.status})`,
      response.status,
      value?.debug_id
    );
  }

  return json as T;
}

export async function createPayPalOrder(params: {
  amount: string;
  currency: string;
  description: string;
  customId: string;
  referenceId: string;
  requestId: string;
  returnUrl?: string;
  cancelUrl?: string;
}): Promise<PayPalOrderResponse> {
  const token = await getAccessToken();
  const description = params.description.slice(0, 127);
  const currency = params.currency;

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: params.referenceId,
        custom_id: params.customId,
        description,
        amount: {
          currency_code: currency,
          value: params.amount,
          breakdown: {
            item_total: { currency_code: currency, value: params.amount },
            shipping: { currency_code: currency, value: "0.00" },
            tax_total: { currency_code: currency, value: "0.00" }
          }
        },
        items: [
          {
            name: description,
            quantity: "1",
            unit_amount: { currency_code: currency, value: params.amount }
          }
        ]
      }
    ],
    application_context: {
      user_action: "PAY_NOW",
      shipping_preference: "NO_SHIPPING",
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl
    }
  };

  return paypalRequest<PayPalOrderResponse>(
    "/v2/checkout/orders",
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "PayPal-Request-Id": params.requestId }
    },
    token
  );
}

export function isCompletedCapture(
  response: PayPalCaptureResponse,
  capture: PayPalCapture | undefined
): capture is PayPalCapture {
  return response.status === "COMPLETED" && capture?.status === "COMPLETED";
}

export function captureMatchesOrder(
  order: { amount: string | null; currency: string },
  capture: PayPalCapture
): boolean {
  if (order.amount === null) return false;

  return (
    order.currency === capture.amount.currency_code &&
    order.amount === capture.amount.value
  );
}

export async function capturePayPalOrder(
  orderId: string,
  requestId: string
): Promise<PayPalCaptureResponse> {
  const token = await getAccessToken();

  return paypalRequest<PayPalCaptureResponse>(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      body: "{}",
      headers: { "PayPal-Request-Id": requestId }
    },
    token
  );
}

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function headerValue(headers: HeaderMap, name: string): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

async function getCertificate(url: string): Promise<string> {
  const cached = certCache.get(url);
  if (cached) return cached;

  const parsed = new URL(url);
  if (
    !parsed.hostname.endsWith(".paypal.com") &&
    !parsed.hostname.endsWith(".paypalobjects.com")
  ) {
    throw new PayPalError("upstream", "Unexpected PayPal certificate host");
  }

  const response = await paypalFetch(url);
  if (!response.ok) {
    throw new PayPalError(
      "upstream",
      `Could not fetch PayPal certificate (${response.status})`,
      response.status
    );
  }

  const certificate = await response.text();
  if (!certificate.includes("BEGIN CERTIFICATE")) {
    throw new PayPalError("upstream", "Invalid PayPal certificate");
  }

  certCache.set(url, certificate);
  return certificate;
}

export async function verifyPayPalWebhook(params: {
  headers: HeaderMap;
  rawBody: Buffer;
}): Promise<boolean> {
  const webhookIds = (env.PAYPAL_WEBHOOK_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (webhookIds.length === 0) {
    throw new PayPalError(
      "not_configured",
      "PAYPAL_WEBHOOK_ID is not configured"
    );
  }

  const transmissionId = headerValue(params.headers, "paypal-transmission-id");
  const transmissionTime = headerValue(
    params.headers,
    "paypal-transmission-time"
  );
  const transmissionSignature = headerValue(
    params.headers,
    "paypal-transmission-sig"
  );
  const certificateUrl = headerValue(params.headers, "paypal-cert-url");

  if (
    !transmissionId ||
    !transmissionTime ||
    !transmissionSignature ||
    !certificateUrl
  ) {
    return false;
  }

  const certificate = await getCertificate(certificateUrl);
  const signature = Buffer.from(transmissionSignature, "base64");
  const checksum = crc32(params.rawBody);

  for (const webhookId of webhookIds) {
    const message = `${transmissionId}|${transmissionTime}|${webhookId}|${checksum}`;
    const verifier = crypto.createVerify("SHA256");
    verifier.update(message);
    if (verifier.verify(certificate, signature)) {
      return true;
    }
  }

  return false;
}
