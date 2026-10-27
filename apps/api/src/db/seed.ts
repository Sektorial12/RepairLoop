import { db, pool } from "./client.js";
import {
  compatibility,
  deviceModels,
  parts,
  sources,
  symptomRules,
  symptoms
} from "./schema.js";
import { catalogData } from "../catalog/data.js";

if (!db) {
  throw new Error("DATABASE_URL is not configured");
}

const database = db;

try {
  // Non-destructive: never delete orders, repair cases, payment events, or
  // audit rows. Existing catalog rows are left in place; use
  // `db:sync-catalog` to update them.
  await database
    .insert(sources)
    .values(catalogData.sources)
    .onConflictDoNothing();
  await database
    .insert(deviceModels)
    .values(catalogData.models)
    .onConflictDoNothing();
  await database
    .insert(parts)
    .values(catalogData.parts)
    .onConflictDoNothing();
  await database
    .insert(compatibility)
    .values(catalogData.compatibility)
    .onConflictDoNothing();
  await database
    .insert(symptoms)
    .values(catalogData.symptoms)
    .onConflictDoNothing();
  await database
    .insert(symptomRules)
    .values(catalogData.symptomRules)
    .onConflictDoNothing();

  console.log("Seed complete (non-destructive)");
  console.log(
    JSON.stringify(
      {
        sources: catalogData.sources.length,
        models: catalogData.models.length,
        parts: catalogData.parts.length,
        compatibility: catalogData.compatibility.length,
        symptoms: catalogData.symptoms.length,
        symptomRules: catalogData.symptomRules.length
      },
      null,
      2
    )
  );
} finally {
  await pool?.end();
}
