import { describe, expect, it } from "vitest";
import { addDamagedBatteryTag } from "../src/catalog/safety.js";

describe("shop safety normalization", () => {
  it("forces the damaged-battery tag when the model sets the safety flag", () => {
    expect(addDamagedBatteryTag(["battery_runtime_short"], true)).toEqual([
      "battery_runtime_short",
      "battery_damaged"
    ]);
  });

  it("does not duplicate an existing damaged-battery tag", () => {
    expect(addDamagedBatteryTag(["battery_damaged"], true)).toEqual([
      "battery_damaged"
    ]);
  });

  it("leaves normal tags unchanged", () => {
    expect(addDamagedBatteryTag(["battery_wont_charge"], false)).toEqual([
      "battery_wont_charge"
    ]);
  });
});
