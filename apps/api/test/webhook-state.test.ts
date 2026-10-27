import { describe, expect, it } from "vitest";
import { nextOrderStatus } from "../src/paypal/webhook-state.js";

describe("PayPal webhook order state", () => {
  it("allows approval only from created", () => {
    expect(nextOrderStatus("created", "CHECKOUT.ORDER.APPROVED")).toBe(
      "approved"
    );
    expect(nextOrderStatus("approved", "CHECKOUT.ORDER.APPROVED")).toBe(null);
    expect(nextOrderStatus("completed", "CHECKOUT.ORDER.APPROVED")).toBe(null);
    expect(nextOrderStatus("refunded", "CHECKOUT.ORDER.APPROVED")).toBe(null);
  });

  it("allows capture completion only from created/approved", () => {
    expect(nextOrderStatus("created", "PAYMENT.CAPTURE.COMPLETED")).toBe(
      "completed"
    );
    expect(nextOrderStatus("approved", "PAYMENT.CAPTURE.COMPLETED")).toBe(
      "completed"
    );
    expect(nextOrderStatus("completed", "PAYMENT.CAPTURE.COMPLETED")).toBe(null);
    expect(nextOrderStatus("refunded", "PAYMENT.CAPTURE.COMPLETED")).toBe(null);
    expect(nextOrderStatus("denied", "PAYMENT.CAPTURE.COMPLETED")).toBe(null);
  });

  it("does not downgrade completed or refunded orders", () => {
    expect(nextOrderStatus("completed", "PAYMENT.CAPTURE.DENIED")).toBe(null);
    expect(nextOrderStatus("refunded", "PAYMENT.CAPTURE.DENIED")).toBe(null);
    expect(nextOrderStatus("created", "PAYMENT.CAPTURE.DENIED")).toBe("denied");
    expect(nextOrderStatus("completed", "PAYMENT.CAPTURE.REFUNDED")).toBe(
      "refunded"
    );
    expect(nextOrderStatus("approved", "PAYMENT.CAPTURE.REFUNDED")).toBe(null);
  });
});
