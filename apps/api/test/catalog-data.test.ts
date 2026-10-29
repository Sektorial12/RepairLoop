import { describe, expect, it } from "vitest";
import {
  catalogData,
  modelSourceIds,
  partAvailability
} from "../src/catalog/data.js";

describe("catalog trust metadata", () => {
  it("source-links every model", () => {
    for (const model of catalogData.models) {
      expect(modelSourceIds[model.id], model.id).toBeTruthy();
    }
    expect(Object.keys(modelSourceIds)).toHaveLength(catalogData.models.length);
  });

  it("does not publish the unsafe P92G or bare 7590 aliases", () => {
    const aliases = catalogData.models.flatMap((model) => [
      model.model,
      ...model.aliases,
      ...(model.regulatoryModel?.split("/") ?? [])
    ]);
    const normalized = aliases.map((alias) =>
      alias.toLowerCase().replace(/[^a-z0-9]/g, "")
    );
    expect(normalized).not.toContain("p92g");
    expect(normalized).not.toContain("7590");
  });

  it("marks R8D7N fitment-verified but seller-reported out of stock", () => {
    expect(partAvailability["part-r8d7n-51wh"]?.status).toBe(
      "reported_out_of_stock"
    );
    expect(partAvailability["part-4gvmp-68wh"]?.status).toBe(
      "reported_in_stock"
    );
  });
});
