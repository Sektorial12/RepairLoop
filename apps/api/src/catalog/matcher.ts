import type {
  CatalogData,
  CompatibilityRow,
  ExcludedOption,
  MatchInput,
  MatchOption,
  MatchResult,
  ModelRow,
  PartRow
} from "./types.js";

const normalize = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const voltageOf = (part: PartRow): number => Number(part.voltage);

function findModel(models: ModelRow[], input: MatchInput): ModelRow | undefined {
  if (input.modelId) {
    const byId = models.find((model) => model.id === input.modelId);
    if (byId) return byId;
  }

  if (!input.modelQuery) return undefined;

  const query = normalize(input.modelQuery);
  const matches = models.filter((model) => {
    const candidates = [
      model.model,
      ...model.aliases,
      ...(model.regulatoryModel ? model.regulatoryModel.split("/") : [])
    ];

    return candidates.some((candidate) => normalize(candidate) === query);
  });

  return matches.length === 1 ? matches[0] : undefined;
}

function findPartByNumber(parts: PartRow[], query: string): PartRow | undefined {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return undefined;

  const direct = parts.find((part) =>
    [part.partNumber, ...part.altPartNumbers].some(
      (number) => normalize(number) === normalizedQuery
    )
  );
  if (direct) return direct;

  // Tolerate report-style suffixes/prefixes, e.g. "DELL X77XY9A" -> "X77XY".
  return parts.find((part) =>
    [part.partNumber, ...part.altPartNumbers].some((number) => {
      const normalizedNumber = normalize(number);
      return (
        normalizedNumber.length >= 4 &&
        (normalizedQuery.includes(normalizedNumber) ||
          normalizedNumber.includes(normalizedQuery))
      );
    })
  );
}

function healthPercent(
  designCapacityMwh?: number,
  fullChargeCapacityMwh?: number
): number | undefined {
  if (
    !designCapacityMwh ||
    !fullChargeCapacityMwh ||
    designCapacityMwh <= 0
  ) {
    return undefined;
  }

  return (
    Math.round(
      Math.min(100, (fullChargeCapacityMwh / designCapacityMwh) * 100) * 10
    ) / 10
  );
}

function healthNote(percent: number): string {
  if (percent < 40) {
    return "Battery health guidance: full charge capacity is below 40% of design capacity; replacement is recommended.";
  }

  return "Battery health guidance: above the 40% replacement threshold; replacement is optional if runtime is insufficient.";
}

function noMatch(reasons: string[], model?: ModelRow): MatchResult {
  return {
    status: "no_match",
    model,
    lowerCapacity: [],
    excluded: [],
    reasons
  };
}

export function matchCatalog(
  data: CatalogData,
  input: MatchInput
): MatchResult {
  const model = findModel(data.models, input);
  if (!model) return noMatch(["unsupported_model"]);

  const requestedTags = new Set(input.symptomTags ?? []);
  const safetySymptom = data.symptoms.find(
    (symptom) => symptom.safetyFlag && requestedTags.has(symptom.tag)
  );

  if (safetySymptom) {
    return {
      status: "safety_stop",
      model,
      lowerCapacity: [],
      excluded: [],
      reasons: ["damaged_battery_safety"],
      safety: {
        tag: safetySymptom.tag,
        label: safetySymptom.label,
        message:
          "Damaged or overheating lithium-ion batteries can be hazardous. Stop using the device, do not attempt a DIY replacement, and contact a repair professional or the device manufacturer."
      }
    };
  }

  const modelCompatibility = data.compatibility.filter(
    (row) => row.modelId === model.id
  );

  const modelParts: Array<{
    compatibility: CompatibilityRow;
    part: PartRow;
  }> = [];
  for (const compatibility of modelCompatibility) {
    const part = data.parts.find(
      (candidate) => candidate.id === compatibility.partId
    );
    if (part) modelParts.push({ compatibility, part });
  }

  if (modelParts.length === 0) {
    return noMatch(["no_catalog_for_model"], model);
  }

  let installed: PartRow | undefined;

  if (input.installedPartNumber) {
    installed = findPartByNumber(data.parts, input.installedPartNumber);
    if (!installed) return noMatch(["unknown_installed_part"], model);
  } else {
    // Capacity alone is not a safe identity: 68Wh can be 7.6V or 15.2V.
    return noMatch(["missing_identity"], model);
  }

  const percent = healthPercent(
    input.designCapacityMwh,
    input.fullChargeCapacityMwh
  );
  const note = percent === undefined ? undefined : healthNote(percent);

  if (installed.status !== "verified") {
    return {
      ...noMatch(["installed_part_unverified"], model),
      installedPart: installed,
      healthPct: percent,
      healthNote: note
    };
  }

  const installedVoltage = voltageOf(installed);
  const exactCandidate = modelParts.find(
    ({ part, compatibility }) =>
      compatibility.status === "verified" &&
      part.status === "verified" &&
      part.capacityWh === installed.capacityWh &&
      voltageOf(part) === installedVoltage &&
      part.cells === installed.cells
  );

  if (!exactCandidate) {
    return {
      ...noMatch(["no_verified_replacement"], model),
      installedPart: installed,
      healthPct: percent,
      healthNote: note
    };
  }

  const exact: MatchOption = {
    part: exactCandidate.part,
    compatibility: exactCandidate.compatibility,
    matchKind: "exact",
    reason: exactCandidate.compatibility.fitmentNote
  };

  const lowerCapacity: MatchOption[] = [];
  const excluded: ExcludedOption[] = [];

  for (const { part, compatibility } of modelParts) {
    if (part.id === exact.part.id) continue;

    const isVerified =
      part.status === "verified" && compatibility.status === "verified";
    const sameVoltage = voltageOf(part) === installedVoltage;

    if (isVerified && part.capacityWh < installed.capacityWh) {
      lowerCapacity.push({
        part,
        compatibility,
        matchKind: "lower_capacity",
        reason: compatibility.fitmentNote
      });
      continue;
    }

    let reason = "different_capacity";
    if (!sameVoltage) reason = "voltage_mismatch";
    else if (part.capacityWh > installed.capacityWh)
      reason = "higher_capacity_not_exact";
    else if (!isVerified) reason = "unverified_for_configuration";

    excluded.push({ part, reason });
  }

  lowerCapacity.sort((a, b) => b.part.capacityWh - a.part.capacityWh);

  return {
    status: "verified_match",
    model,
    installedPart: installed,
    healthPct: percent,
    healthNote: note,
    exact,
    lowerCapacity,
    excluded,
    reasons: []
  };
}
