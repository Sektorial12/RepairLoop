import type { FastifyInstance } from "fastify";
import { loadCatalog } from "../catalog/load.js";
import { db } from "../db/client.js";

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  app.get("/catalog", async (_request, reply) => {
    if (!db) {
      return reply.code(503).send({ error: "database_not_configured" });
    }

    const catalog = await loadCatalog();

    return {
      models: catalog.models,
      parts: catalog.parts,
      compatibility: catalog.compatibility,
      sources: catalog.sources
    };
  });
}
