import {
  catalogData,
  modelSourceIds,
  partAvailability
} from "./data.js";

const MAX_SOURCE_AGE_DAYS = 180;
const errors: string[] = [];

const sourceIds = new Set(catalogData.sources.map((source) => source.id));
const sourceById = new Map(
  catalogData.sources.map((source) => [source.id, source])
);
const modelIds = new Set(catalogData.models.map((model) => model.id));
const partIds = new Set(catalogData.parts.map((part) => part.id));
const aliasOwners = new Map<string, string>();
const normalizeAlias = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");
const forbiddenAliases = new Set(["p92g", "7590"]);

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

for (const model of catalogData.models) {
  const sourceId = modelSourceIds[model.id];
  if (!sourceId) {
    errors.push(`Model ${model.id} has no sourceId`);
  } else if (!sourceIds.has(sourceId)) {
    errors.push(`Model ${model.id} references missing source ${sourceId}`);
  }

  const aliases = [
    model.model,
    ...model.aliases,
    ...(model.regulatoryModel ? model.regulatoryModel.split("/") : [])
  ];
  for (const alias of aliases) {
    const normalized = normalizeAlias(alias);
    if (!normalized) continue;
    if (forbiddenAliases.has(normalized)) {
      errors.push(
        `Model ${model.id} uses unsafe or ambiguous alias ${alias}`
      );
    }
    const owner = aliasOwners.get(normalized);
    if (owner && owner !== model.id) {
      errors.push(
        `Alias collision: ${alias} maps to both ${owner} and ${model.id}`
      );
    }
    aliasOwners.set(normalized, model.id);
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

  const availability = partAvailability[part.id];
  if (!availability) {
    errors.push(`Part ${part.id} has no availability record`);
  } else if (
    !["reported_in_stock", "reported_out_of_stock", "unknown"].includes(
      availability.status
    )
  ) {
    errors.push(`Part ${part.id} has an invalid availability status`);
  }
}

for (const partId of Object.keys(partAvailability)) {
  if (!partIds.has(partId)) {
    errors.push(`Availability references missing part ${partId}`);
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
