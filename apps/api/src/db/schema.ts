import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import type { PartStatus } from "../catalog/types.js";

export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  publisher: text("publisher").notNull(),
  url: text("url").notNull(),
  accessedAt: timestamp("accessed_at", { withTimezone: true }).notNull(),
  licenseTerms: text("license_terms"),
  notes: text("notes")
});

export const deviceModels = pgTable("device_models", {
  id: text("id").primaryKey(),
  brand: text("brand").notNull(),
  family: text("family").notNull(),
  model: text("model").notNull(),
  aliases: jsonb("aliases").$type<string[]>().notNull().default([]),
  regulatoryModel: text("regulatory_model"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const parts = pgTable(
  "parts",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull().default("battery"),
    capacityWh: integer("capacity_wh").notNull(),
    voltage: numeric("voltage", { precision: 4, scale: 1 }).notNull(),
    cells: integer("cells").notNull(),
    partNumber: text("part_number").notNull(),
    altPartNumbers: jsonb("alt_part_numbers")
      .$type<string[]>()
      .notNull()
      .default([]),
    seller: text("seller").notNull(),
    priceDemo: numeric("price_demo", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    status: text("status").$type<PartStatus>().notNull().default("verified"),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [uniqueIndex("parts_part_number_unique").on(table.partNumber)]
);

export const compatibility = pgTable(
  "compatibility",
  {
    id: text("id").primaryKey(),
    modelId: text("model_id")
      .notNull()
      .references(() => deviceModels.id),
    partId: text("part_id")
      .notNull()
      .references(() => parts.id),
    fitmentNote: text("fitment_note").notNull(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    evidenceQuote: text("evidence_quote"),
    status: text("status").$type<PartStatus>().notNull().default("verified"),
    verifiedAt: timestamp("verified_at", { withTimezone: true })
  },
  (table) => [
    uniqueIndex("compatibility_model_part_unique").on(
      table.modelId,
      table.partId
    )
  ]
);

export const symptoms = pgTable(
  "symptoms",
  {
    id: text("id").primaryKey(),
    tag: text("tag").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    safetyFlag: boolean("safety_flag").notNull().default(false)
  },
  (table) => [uniqueIndex("symptoms_tag_unique").on(table.tag)]
);

export const symptomRules = pgTable("symptom_rules", {
  id: text("id").primaryKey(),
  symptomTag: text("symptom_tag").notNull(),
  partCategory: text("part_category").notNull(),
  rationale: text("rationale").notNull(),
  sourceId: text("source_id")
    .notNull()
    .references(() => sources.id)
});

export const repairCases = pgTable("repair_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  modelId: text("model_id").references(() => deviceModels.id),
  installedPartNumber: text("installed_part_number"),
  designCapacityMwh: integer("design_capacity_mwh"),
  fullChargeCapacityMwh: integer("full_charge_capacity_mwh"),
  healthPct: numeric("health_pct", { precision: 5, scale: 2 }),
  symptomTags: jsonb("symptom_tags").$type<string[]>().notNull().default([]),
  selectedPartId: text("selected_part_id").references(() => parts.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  repairCaseId: uuid("repair_case_id").references(() => repairCases.id),
  paypalOrderId: text("paypal_order_id").unique(),
  paypalCaptureId: text("paypal_capture_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("created"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const paymentEvents = pgTable("payment_events", {
  id: text("id").primaryKey(),
  orderId: uuid("order_id").references(() => orders.id),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload"),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  actor: text("actor"),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});
