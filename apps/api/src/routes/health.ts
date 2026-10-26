import type { FastifyInstance } from "fastify";
import { env, serviceVersion } from "../config.js";
import { checkDb } from "../db/client.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({
    ok: true,
    service: "repairloop-api",
    version: serviceVersion,
    db: await checkDb(),
    aiConfigured: Boolean(env.GEMINI_API_KEY),
    paypalConfigured: Boolean(
      env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET
    ),
    time: new Date().toISOString()
  }));
}
