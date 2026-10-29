import type { PartAvailabilityStatus } from "../catalog/types.js";

export type AvailabilityCheck =
  | { ok: true }
  | { ok: false; error: string; message: string };

export function checkPartAvailability(
  availability: PartAvailabilityStatus | undefined
): AvailabilityCheck {
  if (availability === "reported_in_stock") return { ok: true };

  if (availability === "reported_out_of_stock") {
    return {
      ok: false,
      error: "seller_reports_out_of_stock",
      message:
        "The fitment is verified, but the named seller reports this part out of stock. No order was created."
    };
  }

  return {
    ok: false,
    error: "seller_availability_unverified",
    message:
      "The fitment is verified, but seller availability is not verified. Checkout is disabled; check the seller before ordering."
  };
}
