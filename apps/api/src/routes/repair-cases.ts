import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { loadCatalog } from "../catalog/load.js";
import { matchCatalog } from "../catalog/matcher.js";
import { db } from "../db/client.js";
import { repairCases } from "../db/schema.js";

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
