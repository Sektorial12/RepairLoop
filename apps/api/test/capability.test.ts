import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("capture capability token", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("PAYPAL_CLIENT_SECRET", "test-capture-secret");
    vi.stubEnv("RECEIPT_TOKEN_SECRET", "test-receipt-secret-123");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts only the matching order token", async () => {
    const { createCaptureToken, verifyCaptureToken } = await import(
      "../src/checkout/capability.js"
    );
    const token = createCaptureToken("ORDER-1");

    expect(token.length).toBeGreaterThan(20);
    expect(verifyCaptureToken("ORDER-1", token)).toBe(true);
    expect(verifyCaptureToken("ORDER-2", token)).toBe(false);
    expect(verifyCaptureToken("ORDER-1", `${token}x`)).toBe(false);
    expect(verifyCaptureToken("ORDER-1", undefined)).toBe(false);
  });
});
