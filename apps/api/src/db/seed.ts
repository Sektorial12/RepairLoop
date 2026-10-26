import { db, pool } from "./client.js";
import {
  auditLog,
  compatibility,
  deviceModels,
  orders,
  parts,
  paymentEvents,
  repairCases,
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
  await database.delete(paymentEvents);
  await database.delete(orders);
  await database.delete(repairCases);
  await database.delete(compatibility);
  await database.delete(symptomRules);
  await database.delete(symptoms);
  await database.delete(parts);
  await database.delete(deviceModels);
  await database.delete(sources);
  await database.delete(auditLog);

  await database.insert(sources).values(catalogData.sources);
  await database.insert(deviceModels).values(catalogData.models);
  await database.insert(parts).values(catalogData.parts);
  await database.insert(compatibility).values(catalogData.compatibility);
  await database.insert(symptoms).values(catalogData.symptoms);
  await database.insert(symptomRules).values(catalogData.symptomRules);

  console.log("Seed complete");
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
