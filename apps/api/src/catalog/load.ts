import { db } from "../db/client.js";
import {
  compatibility,
  deviceModels,
  parts,
  sources,
  symptoms
} from "../db/schema.js";
import { modelSourceIds, partAvailability } from "./data.js";
import type { CatalogData } from "./types.js";

export async function loadCatalog(): Promise<CatalogData> {
  if (!db) {
    throw new Error("database_not_configured");
  }

  const [models, partRows, compatibilityRows, symptomRows, sourceRows] =
    await Promise.all([
      db.select().from(deviceModels),
      db.select().from(parts),
      db.select().from(compatibility),
      db.select().from(symptoms),
      db.select().from(sources)
    ]);

  return {
    models: models.map((model) => ({
      ...model,
      sourceId: modelSourceIds[model.id] ?? null
    })),
    parts: partRows.map((part) => {
      const availability = partAvailability[part.id];
      return {
        ...part,
        availability: availability?.status ?? "unknown",
        availabilityCheckedAt: availability?.checkedAt ?? null,
        availabilityNote:
          availability?.note ?? "Seller availability was not checked.",
        availabilitySourceUrl: availability?.sourceUrl ?? null
      };
    }),
    compatibility: compatibilityRows,
    symptoms: symptomRows,
    sources: sourceRows,
    symptomRules: []
  };
}
