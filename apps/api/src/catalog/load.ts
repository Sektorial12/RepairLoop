import { db } from "../db/client.js";
import {
  compatibility,
  deviceModels,
  parts,
  sources,
  symptoms
} from "../db/schema.js";
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
    models,
    parts: partRows,
    compatibility: compatibilityRows,
    symptoms: symptomRows,
    sources: sourceRows,
    symptomRules: []
  };
}
