export type AvailabilityStatus =
  | "reported_in_stock"
  | "reported_out_of_stock"
  | "unknown";

export type CatalogPart = {
  id: string;
  name: string;
  partNumber: string;
  altPartNumbers: string[];
  capacityWh: number;
  voltage: string;
  cells: number;
  seller: string;
  priceDemo: string;
  currency: string;
  status: string;
  sourceId: string;
  verifiedAt: string | null;
  notes: string;
  availability?: AvailabilityStatus;
  availabilityCheckedAt?: string | null;
  availabilityNote?: string | null;
  availabilitySourceUrl?: string | null;
};

export type CatalogCompatibility = {
  id: string;
  modelId: string;
  partId: string;
  fitmentNote: string;
  sourceId: string;
  evidenceQuote: string | null;
  status: string;
  verifiedAt: string | null;
};

export type CatalogSource = {
  id: string;
  publisher: string;
  url: string;
  accessedAt: string;
  licenseTerms: string;
  notes: string;
};

export type CatalogModel = {
  id: string;
  brand: string;
  family: string;
  model: string;
  sourceId?: string | null;
};

export type CatalogData = {
  models: CatalogModel[];
  parts: CatalogPart[];
  compatibility: CatalogCompatibility[];
  sources: CatalogSource[];
};

export type MatrixRow = {
  id: string;
  modelId: string;
  modelLabel: string;
  brand: string;
  family: string;
  partId: string;
  partNumber: string;
  partName: string;
  capacityWh: number;
  voltage: string;
  voltageLabel: string;
  cells: number;
  fitmentStatus: string;
  fitmentLabel: string;
  fitmentNote: string;
  evidenceQuote: string | null;
  availability: AvailabilityStatus;
  availabilityLabel: string;
  availabilityNote: string;
  availabilityCheckedAt: string | null;
  seller: string;
  sellerUrl: string | null;
  priceLabel: string;
  sourcePublisher: string | null;
  sourceUrl: string | null;
  modelSourcePublisher: string | null;
  modelSourceUrl: string | null;
  verifiedAt: string | null;
  verifiedLabel: string;
  intakeText: string;
  quoteNote: string;
};

const money = (value: string, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(value));

export const dateLabel = (value: string | null): string => {
  if (!value) return "Not verified";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

export const availabilityLabel = (status: AvailabilityStatus): string => {
  if (status === "reported_in_stock") return "Seller reported in stock";
  if (status === "reported_out_of_stock") return "Seller reported out of stock";
  return "Seller stock not verified";
};

const fitmentLabel = (status: string): string =>
  status === "verified" ? "Verified fitment" : "Unverified fitment";

const sellerSearchUrl = (seller: string, partNumber: string): string | null => {
  if (seller === "Parts-People") {
    return `https://www.parts-people.com/index.php?action=search&search_query=${encodeURIComponent(
      partNumber
    )}`;
  }
  return null;
};

export function buildMatrixRows(catalog: CatalogData): MatrixRow[] {
  const modelById = new Map(catalog.models.map((model) => [model.id, model]));
  const partById = new Map(catalog.parts.map((part) => [part.id, part]));
  const sourceById = new Map(
    catalog.sources.map((source) => [source.id, source])
  );
  const rows: MatrixRow[] = [];

  for (const compatibility of catalog.compatibility) {
    const model = modelById.get(compatibility.modelId);
    const part = partById.get(compatibility.partId);
    if (!model || !part) continue;

    const source = sourceById.get(compatibility.sourceId);
    const modelSource = model.sourceId
      ? sourceById.get(model.sourceId)
      : undefined;
    const availability = part.availability ?? "unknown";
    const modelLabel = `${model.brand} ${model.model}`;
    const voltageLabel = `${Number(part.voltage).toFixed(2)}V`;
    const sellerUrl =
      sellerSearchUrl(part.seller, part.partNumber) ?? source?.url ?? null;
    const priceLabel = money(part.priceDemo, part.currency);
    const verifiedAt = compatibility.verifiedAt ?? part.verifiedAt;

    rows.push({
      id: compatibility.id,
      modelId: model.id,
      modelLabel,
      brand: model.brand,
      family: model.family,
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.name,
      capacityWh: part.capacityWh,
      voltage: part.voltage,
      voltageLabel,
      cells: part.cells,
      fitmentStatus: compatibility.status,
      fitmentLabel: fitmentLabel(compatibility.status),
      fitmentNote: compatibility.fitmentNote,
      evidenceQuote: compatibility.evidenceQuote,
      availability,
      availabilityLabel: availabilityLabel(availability),
      availabilityNote:
        part.availabilityNote ?? "Seller availability was not checked.",
      availabilityCheckedAt: part.availabilityCheckedAt ?? null,
      seller: part.seller,
      sellerUrl,
      priceLabel,
      sourcePublisher: source?.publisher ?? null,
      sourceUrl: source?.url ?? null,
      modelSourcePublisher: modelSource?.publisher ?? null,
      modelSourceUrl: modelSource?.url ?? null,
      verifiedAt,
      verifiedLabel: dateLabel(verifiedAt),
      intakeText: `${modelLabel}, installed part ${part.partNumber}. Please verify the exact replacement battery.`,
      quoteNote: `${modelLabel} · ${part.partNumber} · ${part.capacityWh}Wh ${voltageLabel} ${part.cells}-cell · ${part.seller} demo ${priceLabel} · Source: ${source?.publisher ?? "unavailable"}. Fitment: ${compatibility.fitmentNote}`
    });
  }

  return rows.sort((a, b) => {
    const modelOrder = a.modelLabel.localeCompare(b.modelLabel);
    if (modelOrder !== 0) return modelOrder;
    return a.partNumber.localeCompare(b.partNumber);
  });
}
