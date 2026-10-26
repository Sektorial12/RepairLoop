export type PartStatus = "verified" | "unverified" | "stale" | "rejected";

export interface SupportedModel {
  id: string;
  brand: string;
  family: string;
  model: string;
  aliases: string[];
  regulatoryModel?: string | null;
}

export interface CatalogPart {
  id: string;
  name: string;
  capacityWh: number;
  voltage: number;
  cells: number;
  partNumber: string;
  altPartNumbers: string[];
  status: PartStatus;
  priceDemo: string;
  currency: string;
  seller: string;
  sourceId: string;
  verifiedAt: string | null;
  notes?: string | null;
}

export type MatchStatus = "verified_match" | "no_match" | "safety_stop";

export interface MatchResponse {
  status: MatchStatus;
  model?: SupportedModel;
  installedPart?: CatalogPart;
  healthPct?: number;
  healthNote?: string;
  exact?: {
    part: CatalogPart;
    matchKind: "exact";
    reason: string;
  };
  lowerCapacity: Array<{
    part: CatalogPart;
    matchKind: "lower_capacity";
    reason: string;
  }>;
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
}
