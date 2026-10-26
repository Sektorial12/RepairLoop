import { catalogData } from "./data.js";

const errors: string[] = [];

const sourceIds = new Set(catalogData.sources.map((source) => source.id));
const modelIds = new Set(catalogData.models.map((model) => model.id));
const partIds = new Set(catalogData.parts.map((part) => part.id));

for (const part of catalogData.parts) {
  if (!sourceIds.has(part.sourceId)) {
    errors.push(`Part ${part.id} references missing source ${part.sourceId}`);
  }
  if (part.status === "verified" && !part.verifiedAt) {
    errors.push(`Verified part ${part.id} is missing verifiedAt`);
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
