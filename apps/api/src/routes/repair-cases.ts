import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { partAvailability } from "../catalog/data.js";
import { loadCatalog } from "../catalog/load.js";
import { matchCatalog } from "../catalog/matcher.js";
import { db } from "../db/client.js";
import { parts, repairCases, sources } from "../db/schema.js";

const BodySchema = z
  .object({
    modelId: z.string().min(1).optional(),
    modelQuery: z.string().min(1).optional(),
    installedPartNumber: z.string().min(1).optional(),
    designCapacityMwh: z.number().int().positive().optional(),
    fullChargeCapacityMwh: z.number().int().positive().optional(),
    symptomTags: z.array(z.string().min(1)).default([]),
    partId: z.string().min(1)
  })
  .refine((value) => Boolean(value.modelId || value.modelQuery), {
    message: "modelId or modelQuery is required"
  });

export async function repairCaseRoutes(
  app: FastifyInstance
): Promise<void> {

  app.get("/repair-cases/:id", async (request, reply) => {
    if (!db) {
      return reply.code(503).send({ error: "database_not_configured" });
    }

    const parsed = z.string().uuid().safeParse((request.params as { id?: string }).id);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_request" });
    }

    const [row] = await db
      .select({
        id: repairCases.id,
        modelId: repairCases.modelId,
        installedPartNumber: repairCases.installedPartNumber,
        designCapacityMwh: repairCases.designCapacityMwh,
        fullChargeCapacityMwh: repairCases.fullChargeCapacityMwh,
        healthPct: repairCases.healthPct,
        symptomTags: repairCases.symptomTags,
        selectedPartId: repairCases.selectedPartId,
        createdAt: repairCases.createdAt,
        partNumber: parts.partNumber,
        partName: parts.name,
        seller: parts.seller,
        priceDemo: parts.priceDemo,
        currency: parts.currency,
        sourcePublisher: sources.publisher,
        sourceUrl: sources.url
      })
      .from(repairCases)
      .leftJoin(parts, eq(repairCases.selectedPartId, parts.id))
      .leftJoin(sources, eq(parts.sourceId, sources.id))
      .where(eq(repairCases.id, parsed.data))
      .limit(1);

    if (!row) {
      return reply.code(404).send({ error: "repair_case_not_found" });
    }

    return {
      case: {
        id: row.id,
        modelId: row.modelId,
        installedPartNumber: row.installedPartNumber,
        designCapacityMwh: row.designCapacityMwh,
        fullChargeCapacityMwh: row.fullChargeCapacityMwh,
        healthPct: row.healthPct,
        symptomTags: row.symptomTags,
        createdAt: row.createdAt,
        selectedPart: row.partNumber
          ? {
              partNumber: row.partNumber,
              name: row.partName,
              seller: row.seller,
              priceDemo: row.priceDemo,
              currency: row.currency,
              availability:
                partAvailability[row.selectedPartId ?? ""]?.status ?? "unknown",
              availabilityCheckedAt:
                partAvailability[row.selectedPartId ?? ""]?.checkedAt ?? null,
              availabilityNote:
                partAvailability[row.selectedPartId ?? ""]?.note ??
                "Seller availability was not checked.",
              sourcePublisher: row.sourcePublisher,
              sourceUrl: row.sourceUrl
            }
          : null
      }
    };
  });

  app.post("/repair-cases", async (request, reply) => {
    if (!db) {
      return reply.code(503).send({ error: "database_not_configured" });
    }

    const parsed = BodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_request",
        issues: parsed.error.issues
      });
    }

    const catalog = await loadCatalog();
    const result = matchCatalog(catalog, parsed.data);

    if (result.status !== "verified_match" || !result.model) {
      return reply.code(422).send({
        error: "no_verified_match",
        reasons: result.reasons
      });
    }

    const options = [
      ...(result.exact ? [result.exact] : []),
      ...result.lowerCapacity
    ];
    const selected = options.find(
      (option) => option.part.id === parsed.data.partId
    );

    if (!selected) {
      return reply.code(422).send({
        error: "invalid_selection",
        message: "The selected part is not a verified option for this case."
      });
    }

    const [repairCase] = await db
      .insert(repairCases)
      .values({
        modelId: result.model.id,
        installedPartNumber: parsed.data.installedPartNumber ?? null,
        designCapacityMwh: parsed.data.designCapacityMwh ?? null,
        fullChargeCapacityMwh: parsed.data.fullChargeCapacityMwh ?? null,
        healthPct:
          result.healthPct !== undefined
            ? result.healthPct.toFixed(2)
            : null,
        symptomTags: parsed.data.symptomTags,
        selectedPartId: selected.part.id
      })
      .returning();

    if (!repairCase) {
      return reply.code(500).send({ error: "repair_case_create_failed" });
    }

    return {
      repairCaseId: repairCase.id,
      selectedPart: selected.part,
      healthPct: result.healthPct ?? null,
      healthNote: result.healthNote ?? null
    };
  });
}
