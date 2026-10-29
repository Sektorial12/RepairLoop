import { execFileSync } from "node:child_process";
import { createSign } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crc ^ byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

describe("PayPal webhook signature", () => {
  let dir: string;

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("PAYPAL_CLIENT_ID", "test-client");
    vi.stubEnv("PAYPAL_CLIENT_SECRET", "test-secret");
    vi.stubEnv("PAYPAL_WEBHOOK_ID", "test-webhook");
    dir = mkdtempSync(join(tmpdir(), "repairloop-webhook-"));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    rmSync(dir, { recursive: true, force: true });
  });

  it("accepts a correctly signed transmission from a PayPal certificate host", async () => {
    const keyPath = join(dir, "key.pem");
    const certPath = join(dir, "cert.pem");
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        keyPath,
        "-out",
        certPath,
        "-days",
        "1",
        "-subj",
        "/CN=repairloop-webhook-test"
      ],
      { stdio: "ignore" }
    );

    const certificate = readFileSync(certPath, "utf8");
    const privateKey = readFileSync(keyPath, "utf8");
    const rawBody = Buffer.from(
      JSON.stringify({ id: "WH-TEST", event_type: "PAYMENT.CAPTURE.COMPLETED" })
    );
    const transmissionId = "transmission-test";
    const transmissionTime = new Date().toISOString();
    const webhookId = "test-webhook";
    const message = `${transmissionId}|${transmissionTime}|${webhookId}|${crc32(rawBody)}`;
    const signature = createSign("SHA256")
      .update(message)
      .sign(privateKey, "base64");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(certificate, {
          status: 200,
          headers: { "content-type": "application/x-pem-file" }
        })
      )
    );

    const { verifyPayPalWebhook } = await import("../src/paypal/client.js");
    const accepted = await verifyPayPalWebhook({
      headers: {
        "paypal-transmission-id": transmissionId,
        "paypal-transmission-time": transmissionTime,
        "paypal-transmission-sig": signature,
        "paypal-cert-url":
          "https://api.paypal.com/cert-test-" + Date.now() + ".pem"
      },
      rawBody
    });

    expect(accepted).toBe(true);
  });
});
