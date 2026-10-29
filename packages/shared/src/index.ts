export type PartStatus = "verified" | "unverified" | "stale" | "rejected";

export type AvailabilityStatus =
  | "reported_in_stock"
  | "reported_out_of_stock"
  | "unknown";

export interface SupportedModel {
  id: string;
  brand: string;
  family: string;
  model: string;
  aliases: string[];
  regulatoryModel?: string | null;
  sourceId?: string | null;
}

export interface CatalogSource {
  id: string;
  publisher: string;
  url: string;
  accessedAt: string;
  licenseTerms?: string | null;
  notes?: string | null;
}

export interface CatalogPart {
  id: string;
  name: string;
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
  verifiedAt: string | null;
  notes?: string | null;
  availability?: AvailabilityStatus;
  availabilityCheckedAt?: string | null;
  availabilityNote?: string | null;
  availabilitySourceUrl?: string | null;
}

export interface CompatibilityRow {
  id: string;
  modelId: string;
  partId: string;
  fitmentNote: string;
  sourceId: string;
  evidenceQuote?: string | null;
  status: PartStatus;
  verifiedAt: string | null;
}

export interface CatalogData {
  models: SupportedModel[];
  parts: CatalogPart[];
  compatibility: CompatibilityRow[];
  sources: CatalogSource[];
}

export type MatchStatus = "verified_match" | "no_match" | "safety_stop";

export interface MatchOption {
  part: CatalogPart;
  compatibility: CompatibilityRow;
  matchKind: "exact" | "lower_capacity";
  reason: string;
}

export interface MatchResponse {
  status: MatchStatus;
  model?: SupportedModel;
  installedPart?: CatalogPart;
  healthPct?: number;
  healthNote?: string;
  exact?: MatchOption;
  lowerCapacity: MatchOption[];
  excluded: Array<{
    part: CatalogPart;
    reason: string;
  }>;
  reasons: string[];
  safety?: {
    tag: string;
    label: string;
    message: string;
  };
  sources?: CatalogSource[];
}
