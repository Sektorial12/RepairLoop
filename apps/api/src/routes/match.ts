import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { matchCatalog } from "../catalog/matcher.js";
import { db } from "../db/client.js";
import {
  compatibility,
  deviceModels,
  parts,
  sources,
  symptoms
} from "../db/schema.js";

const MatchBodySchema = z
  .object({
    modelId: z.string().min(1).optional(),
    modelQuery: z.string().min(1).optional(),
    installedPartNumber: z.string().min(1).optional(),
    designCapacityMwh: z.number().int().positive().optional(),
    fullChargeCapacityMwh: z.number().int().positive().optional(),
    symptomTags: z.array(z.string().min(1)).default([])
  })
  .refine((value) => Boolean(value.modelId || value.modelQuery), {
    message: "modelId or modelQuery is required"
  });

export async function matchRoutes(app: FastifyInstance): Promise<void> {
  app.post("/match", async (request, reply) => {
    if (!db) {
      return reply.code(503).send({ error: "database_not_configured" });
    }

    const parsed = MatchBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_request",
        issues: parsed.error.issues
      });
    }

    const [models, partRows, compatibilityRows, symptomRows, sourceRows] =
      await Promise.all([
        db.select().from(deviceModels),
        db.select().from(parts),
        db.select().from(compatibility),
        db.select().from(symptoms),
        db.select().from(sources)
      ]);

    const result = matchCatalog(
      {
        sources: sourceRows,
        models,
        parts: partRows,
        compatibility: compatibilityRows,
        symptoms: symptomRows,
        symptomRules: []
      },
      parsed.data
    );

    return { ...result, sources: sourceRows };
  });
}
