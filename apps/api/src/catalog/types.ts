export type PartStatus = "verified" | "unverified" | "stale" | "rejected";

export interface SourceRow {
  id: string;
  publisher: string;
  url: string;
  accessedAt: Date;
  licenseTerms?: string | null;
  notes?: string | null;
}

export interface ModelRow {
  id: string;
  brand: string;
  family: string;
  model: string;
  aliases: string[];
  regulatoryModel?: string | null;
}

export interface PartRow {
  id: string;
  name: string;
  category: string;
  capacityWh: number;
  voltage: string;
  cells: number;
  partNumber: string;
  altPartNumbers: string[];
  seller: string;
  priceDemo: string;
  currency: string;
  status: PartStatus;
  sourceId: string;
  verifiedAt: Date | null;
  notes?: string | null;
}

export interface CompatibilityRow {
  id: string;
  modelId: string;
  partId: string;
  fitmentNote: string;
  sourceId: string;
  evidenceQuote?: string | null;
  status: PartStatus;
  verifiedAt: Date | null;
}

export interface SymptomRow {
  id: string;
  tag: string;
  label: string;
  description?: string | null;
  safetyFlag: boolean;
}

export interface SymptomRuleRow {
  id: string;
  symptomTag: string;
  partCategory: string;
  rationale: string;
  sourceId: string;
}

export interface CatalogData {
  sources: SourceRow[];
  models: ModelRow[];
  parts: PartRow[];
  compatibility: CompatibilityRow[];
  symptoms: SymptomRow[];
  symptomRules: SymptomRuleRow[];
}

export interface MatchInput {
  modelId?: string;
  modelQuery?: string;
  installedPartNumber?: string;
  designCapacityMwh?: number;
  fullChargeCapacityMwh?: number;
  symptomTags?: string[];
}

export interface MatchOption {
  part: PartRow;
  compatibility: CompatibilityRow;
  matchKind: "exact" | "lower_capacity";
  reason: string;
}

export interface ExcludedOption {
  part: PartRow;
  reason: string;
}

export interface MatchResult {
  status: "verified_match" | "no_match" | "safety_stop";
  model?: ModelRow;
  installedPart?: PartRow;
  healthPct?: number;
  healthNote?: string;
  exact?: MatchOption;
  lowerCapacity: MatchOption[];
  excluded: ExcludedOption[];
  reasons: string[];
  safety?: {
    tag: string;
    label: string;
    message: string;
  };
}
