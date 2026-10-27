export function nextOrderStatus(
  current: string,
  eventType: string
): string | null {
  switch (eventType) {
    case "CHECKOUT.ORDER.APPROVED":
      return current === "created" ? "approved" : null;
    case "PAYMENT.CAPTURE.COMPLETED":
      return current === "created" || current === "approved"
        ? "completed"
        : null;
    case "PAYMENT.CAPTURE.DENIED":
      return current === "created" || current === "approved"
        ? "denied"
        : null;
    case "PAYMENT.CAPTURE.REFUNDED":
      return current === "completed" ? "refunded" : null;
    default:
      return null;
  }
}
