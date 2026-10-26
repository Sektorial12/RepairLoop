import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { deviceModels } from "../db/schema.js";

export async function modelRoutes(app: FastifyInstance): Promise<void> {
  app.get("/models", async (_request, reply) => {
    if (!db) {
      return reply.code(503).send({ error: "database_not_configured" });
    }

    const models = await db
      .select()
      .from(deviceModels)
      .orderBy(deviceModels.model);

    return { models };
  });
}
