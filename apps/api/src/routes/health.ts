import type { FastifyInstance } from "fastify";
import { env, serviceVersion } from "../config.js";
import { checkDb } from "../db/client.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  const status = async () => ({
    ok: true,
    service: "repairloop-api",
    version: serviceVersion,
    db: await checkDb(),
    aiConfigured: Boolean(env.GEMINI_API_KEY && env.GEMINI_MODEL),
    paypalConfigured: Boolean(
      env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET
    ),
    time: new Date().toISOString()
  });

  app.get("/live", async () => ({
    ok: true,
    service: "repairloop-api",
    version: serviceVersion
  }));

  app.get("/health", status);
  app.get("/api/status", status);
}
