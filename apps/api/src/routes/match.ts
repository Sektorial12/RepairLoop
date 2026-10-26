import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { loadCatalog } from "../catalog/load.js";
import { matchCatalog } from "../catalog/matcher.js";
import { db } from "../db/client.js";

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

    const catalog = await loadCatalog();
    const result = matchCatalog(catalog, parsed.data);

    return { ...result, sources: catalog.sources };
  });
}
