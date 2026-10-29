import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config.js";

function tokenSecret(): string | null {
  return env.RECEIPT_TOKEN_SECRET ?? env.PAYPAL_CLIENT_SECRET ?? null;
}

export function createCaptureToken(paypalOrderId: string): string {
  const secret = tokenSecret();
  if (!secret) return "";
  return createHmac("sha256", secret)
    .update(`repairloop-capture:${paypalOrderId}`)
    .digest("base64url");
}

export function verifyCaptureToken(
  paypalOrderId: string,
  candidate: string | undefined
): boolean {
  const expected = createCaptureToken(paypalOrderId);
  if (!expected || !candidate) return false;
  const expectedBuffer = Buffer.from(expected);
  const candidateBuffer = Buffer.from(candidate);
  return (
    expectedBuffer.length === candidateBuffer.length &&
    timingSafeEqual(expectedBuffer, candidateBuffer)
  );
}
