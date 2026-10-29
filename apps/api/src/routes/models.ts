import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { loadCatalog } from "../catalog/load.js";

export async function modelRoutes(app: FastifyInstance): Promise<void> {
  app.get("/models", async (_request, reply) => {
    if (!db) {
      return reply.code(503).send({ error: "database_not_configured" });
    }

    const catalog = await loadCatalog();
    const models = [...catalog.models].sort((a, b) =>
      a.model.localeCompare(b.model)
    );

    return { models };
  });
}
