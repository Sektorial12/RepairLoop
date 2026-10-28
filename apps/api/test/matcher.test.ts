import { describe, expect, it } from "vitest";
import { catalogData } from "../src/catalog/data.js";
import { matchCatalog } from "../src/catalog/matcher.js";

describe("catalog matcher", () => {
  it("matches the installed X77XY to the exact 68Wh 7.6V family", () => {
    const result = matchCatalog(catalogData, {
      modelQuery: "Latitude 5400",
      installedPartNumber: "X77XY",
      designCapacityMwh: 68005,
      fullChargeCapacityMwh: 46907,
      symptomTags: ["battery_runtime_short"]
    });

    expect(result.status).toBe("verified_match");
    expect(result.exact?.part.partNumber).toBe("4GVMP");
    expect(result.lowerCapacity.map((option) => option.part.partNumber)).toEqual([
      "R8D7N",
      "1V1XF"
    ]);
    expect(result.excluded.map((option) => option.part.partNumber)).toContain(
      "3HWPP"
    );
    expect(result.healthPct).toBeCloseTo(69, 0);
    expect(result.healthNote).toContain("40%");
  });

  it("accepts a report-style battery name with a suffix", () => {
    const result = matchCatalog(catalogData, {
      modelQuery: "Dell Latitude 5400",
      installedPartNumber: "DELL X77XY9A",
      designCapacityMwh: 68005,
      fullChargeCapacityMwh: 46907
    });

    expect(result.status).toBe("verified_match");
    expect(result.exact?.part.partNumber).toBe("4GVMP");
  });

  it("refuses an ambiguous model query instead of selecting the first model", () => {
    const result = matchCatalog(catalogData, {
      modelQuery: "Dell",
      installedPartNumber: "X77XY",
      designCapacityMwh: 68005,
      fullChargeCapacityMwh: 46907
    });

    expect(result.status).toBe("no_match");
    expect(result.reasons).toContain("unsupported_model");
  });

  it("refuses to infer an exact part from capacity alone", () => {
    const result = matchCatalog(catalogData, {
      modelQuery: "Latitude 5400",
      designCapacityMwh: 68005,
      fullChargeCapacityMwh: 46907
    });

    expect(result.status).toBe("no_match");
    expect(result.reasons).toContain("missing_identity");
  });

  it("supports a 51Wh Latitude 5410 with the R8D7N family", () => {
    const result = matchCatalog(catalogData, {
      modelId: "dell-latitude-5410",
      installedPartNumber: "R8D7N",
      designCapacityMwh: 51000,
      fullChargeCapacityMwh: 40000
    });

    expect(result.status).toBe("verified_match");
    expect(result.exact?.part.partNumber).toBe("R8D7N");
    expect(
      result.lowerCapacity.map((option) => option.part.partNumber)
    ).toContain("1V1XF");
  });

  it("supports a 68Wh Inspiron 7590 with the 4GVMP family", () => {
    const result = matchCatalog(catalogData, {
      modelId: "dell-inspiron-7590-2in1",
      installedPartNumber: "X77XY",
      designCapacityMwh: 68005,
      fullChargeCapacityMwh: 46907
    });

    expect(result.status).toBe("verified_match");
    expect(result.exact?.part.partNumber).toBe("4GVMP");
  });

  it("supports the Lenovo ThinkPad T480s 57Wh battery", () => {
    const result = matchCatalog(catalogData, {
      modelQuery: "ThinkPad T480s",
      installedPartNumber: "01AV478",
      designCapacityMwh: 57000,
      fullChargeCapacityMwh: 40000
    });

    expect(result.status).toBe("verified_match");
    expect(result.exact?.part.partNumber).toBe("01AV478");
  });

  it("does not offer the 68Wh 4GVMP for a 51Wh Latitude 5410", () => {
    const result = matchCatalog(catalogData, {
      modelId: "dell-latitude-5410",
      installedPartNumber: "4GVMP",
      designCapacityMwh: 68005,
      fullChargeCapacityMwh: 46907
    });

    expect(result.status).toBe("no_match");
    expect(result.reasons).toContain("no_verified_replacement");
  });

  it("marks the 68Wh 15.2V 3HWPP as unverified when it is the installed part", () => {
    const result = matchCatalog(catalogData, {
      modelQuery: "Latitude 5400",
      installedPartNumber: "3HWPP",
      designCapacityMwh: 68000
    });

    expect(result.status).toBe("no_match");
    expect(result.reasons).toContain("installed_part_unverified");
  });

  it("stops for a damaged-battery symptom", () => {
    const result = matchCatalog(catalogData, {
      modelQuery: "Latitude 5400",
      installedPartNumber: "X77XY",
      symptomTags: ["battery_damaged"]
    });

    expect(result.status).toBe("safety_stop");
    expect(result.safety?.tag).toBe("battery_damaged");
  });

  it("returns no match for an unsupported model", () => {
    const result = matchCatalog(catalogData, {
      modelQuery: "MacBook Pro 14",
      installedPartNumber: "X77XY"
    });

    expect(result.status).toBe("no_match");
    expect(result.reasons).toContain("unsupported_model");
  });

  it("returns no match for an unknown installed part", () => {
    const result = matchCatalog(catalogData, {
      modelQuery: "Latitude 5400",
      installedPartNumber: "NOT-A-REAL-PART"
    });

    expect(result.status).toBe("no_match");
    expect(result.reasons).toContain("unknown_installed_part");
  });

  it("treats 42Wh as exact and does not offer higher capacities as lower options", () => {
    const result = matchCatalog(catalogData, {
      modelQuery: "Latitude 5400",
      installedPartNumber: "1V1XF",
      designCapacityMwh: 42000,
      fullChargeCapacityMwh: 30000
    });

    expect(result.status).toBe("verified_match");
    expect(result.exact?.part.partNumber).toBe("1V1XF");
    expect(result.lowerCapacity).toHaveLength(0);
    expect(result.excluded.map((option) => option.part.partNumber)).toContain(
      "4GVMP"
    );
  });
});
