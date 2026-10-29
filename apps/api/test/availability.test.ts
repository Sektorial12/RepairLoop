import { describe, expect, it } from "vitest";
import { checkPartAvailability } from "../src/checkout/availability.js";

describe("checkout availability policy", () => {
  it("allows a reported in-stock part", () => {
    expect(checkPartAvailability("reported_in_stock")).toEqual({ ok: true });
  });

  it("blocks a reported out-of-stock part", () => {
    expect(checkPartAvailability("reported_out_of_stock")).toMatchObject({
      ok: false,
      error: "seller_reports_out_of_stock"
    });
  });

  it("blocks an unknown or missing availability", () => {
    expect(checkPartAvailability("unknown")).toMatchObject({
      ok: false,
      error: "seller_availability_unverified"
    });
    expect(checkPartAvailability(undefined)).toMatchObject({
      ok: false,
      error: "seller_availability_unverified"
    });
  });
});
