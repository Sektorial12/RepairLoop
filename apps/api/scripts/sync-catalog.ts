import { eq } from "drizzle-orm";
import { catalogData } from "../src/catalog/data.js";
import { closeDb, db } from "../src/db/client.js";
import {
  compatibility,
  deviceModels,
  parts,
  sources
} from "../src/db/schema.js";

if (!db) {
  console.error("DATABASE_URL is required to sync the catalog.");
  process.exit(1);
}

const database = db;

try {
  for (const source of catalogData.sources) {
    await database
      .update(sources)
      .set({
        publisher: source.publisher,
        url: source.url,
        accessedAt: source.accessedAt,
        licenseTerms: source.licenseTerms ?? null,
        notes: source.notes ?? null
      })
      .where(eq(sources.id, source.id));
  }

  for (const model of catalogData.models) {
    await database
      .update(deviceModels)
      .set({
        brand: model.brand,
        family: model.family,
        model: model.model,
        aliases: model.aliases,
        regulatoryModel: model.regulatoryModel ?? null
      })
      .where(eq(deviceModels.id, model.id));
  }

  for (const part of catalogData.parts) {
    await database
      .update(parts)
      .set({
        name: part.name,
        category: part.category,
        capacityWh: part.capacityWh,
        voltage: part.voltage,
        cells: part.cells,
        partNumber: part.partNumber,
        altPartNumbers: part.altPartNumbers,
        seller: part.seller,
        priceDemo: part.priceDemo,
        currency: part.currency,
        status: part.status,
        sourceId: part.sourceId,
        verifiedAt: part.verifiedAt,
        notes: part.notes ?? null
      })
      .where(eq(parts.id, part.id));
  }

  for (const row of catalogData.compatibility) {
    await database
      .update(compatibility)
      .set({
        modelId: row.modelId,
        partId: row.partId,
        fitmentNote: row.fitmentNote,
        sourceId: row.sourceId,
        evidenceQuote: row.evidenceQuote ?? null,
        status: row.status,
        verifiedAt: row.verifiedAt
      })
      .where(eq(compatibility.id, row.id));
  }

  console.log(
    `Catalog sync passed: ${catalogData.models.length} models, ${catalogData.sources.length} sources, ${catalogData.parts.length} parts, ${catalogData.compatibility.length} compatibility rows.`
  );
} catch (error) {
  console.error("Catalog sync failed:", error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
