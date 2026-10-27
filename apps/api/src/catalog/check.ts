import { catalogData } from "./data.js";

const MAX_SOURCE_AGE_DAYS = 180;
const errors: string[] = [];

const sourceIds = new Set(catalogData.sources.map((source) => source.id));
const sourceById = new Map(
  catalogData.sources.map((source) => [source.id, source])
);
const modelIds = new Set(catalogData.models.map((model) => model.id));
const partIds = new Set(catalogData.parts.map((part) => part.id));

for (const source of catalogData.sources) {
  if (!source.publisher.trim()) {
    errors.push(`Source ${source.id} has no publisher`);
  }
  if (!/^https:\/\//.test(source.url)) {
    errors.push(`Source ${source.id} does not use an HTTPS URL`);
  }
  if (
    !(source.accessedAt instanceof Date) ||
    Number.isNaN(source.accessedAt.getTime())
  ) {
    errors.push(`Source ${source.id} has an invalid accessedAt`);
  } else {
    const ageDays =
      (Date.now() - source.accessedAt.getTime()) / (24 * 60 * 60 * 1000);
    if (ageDays > MAX_SOURCE_AGE_DAYS) {
      errors.push(
        `Source ${source.id} is older than ${MAX_SOURCE_AGE_DAYS} days`
      );
    }
  }
}

for (const part of catalogData.parts) {
  if (!sourceIds.has(part.sourceId)) {
    errors.push(`Part ${part.id} references missing source ${part.sourceId}`);
  }
  if (part.status === "verified" && !part.verifiedAt) {
    errors.push(`Verified part ${part.id} is missing verifiedAt`);
  }
  if (part.verifiedAt && part.verifiedAt.getTime() > Date.now()) {
    errors.push(`Verified part ${part.id} has a future verifiedAt`);
  }
}

for (const row of catalogData.compatibility) {
  if (!modelIds.has(row.modelId)) {
    errors.push(`Compatibility ${row.id} references missing model ${row.modelId}`);
  }
  if (!partIds.has(row.partId)) {
    errors.push(`Compatibility ${row.id} references missing part ${row.partId}`);
  }
  if (!sourceIds.has(row.sourceId)) {
    errors.push(`Compatibility ${row.id} references missing source ${row.sourceId}`);
  }
  if (row.status === "verified" && !row.verifiedAt) {
    errors.push(`Verified compatibility ${row.id} is missing verifiedAt`);
  }
  if (row.verifiedAt && row.verifiedAt.getTime() > Date.now()) {
    errors.push(`Verified compatibility ${row.id} has a future verifiedAt`);
  }
  if (row.status === "verified") {
    const source = sourceById.get(row.sourceId);
    if (!source) {
      errors.push(`Verified compatibility ${row.id} has no source`);
    }
    if (!row.evidenceQuote?.trim()) {
      errors.push(`Verified compatibility ${row.id} has no evidence quote`);
    }
  }
}

const verifiedParts = catalogData.parts.filter((part) => part.status === "verified");
const unverifiedParts = catalogData.parts.filter(
  (part) => part.status === "unverified"
);

if (verifiedParts.length < 3) {
  errors.push(`Expected at least 3 verified battery families, found ${verifiedParts.length}`);
}
if (unverifiedParts.length < 1) {
  errors.push("Expected at least 1 unverified wrong-variant part");
}

const wrongVariant = catalogData.parts.find(
  (part) => part.partNumber === "3HWPP"
);
if (!wrongVariant || wrongVariant.status !== "unverified") {
  errors.push("3HWPP must exist and remain unverified for this 7.6V configuration");
}

if (errors.length > 0) {
  console.error("Catalog check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Catalog check passed");
console.log(
  JSON.stringify(
    {
      sources: catalogData.sources.length,
      models: catalogData.models.length,
      parts: catalogData.parts.length,
      verifiedParts: verifiedParts.length,
      unverifiedParts: unverifiedParts.length,
      compatibilityRows: catalogData.compatibility.length,
      symptoms: catalogData.symptoms.length
    },
    null,
    2
  )
);
