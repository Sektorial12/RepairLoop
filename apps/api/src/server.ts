import Fastify from "fastify";
import type { FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import { corsOrigins, env, serviceVersion } from "./config.js";
import { closeDb } from "./db/client.js";
import { aiRoutes } from "./routes/ai.js";
import { checkoutRoutes } from "./routes/checkout.js";
import { healthRoutes } from "./routes/health.js";
import { matchRoutes } from "./routes/match.js";
import { modelRoutes } from "./routes/models.js";
import { paypalRoutes } from "./routes/paypal.js";
import { repairCaseRoutes } from "./routes/repair-cases.js";
import { webhookRoutes } from "./routes/webhooks.js";

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL
  },
  bodyLimit: 10 * 1024 * 1024
});

await app.register(cors, {
  origin: corsOrigins,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
});

// Keep the raw JSON body for PayPal webhook signature verification.
app.addContentTypeParser(
  "application/json",
  { parseAs: "buffer" },
  (request, body, done) => {
    const rawBody = Buffer.isBuffer(body) ? body : Buffer.from(body);
    (request as FastifyRequest & { rawBody?: Buffer }).rawBody = rawBody;
    try {
      done(null, JSON.parse(rawBody.toString()));
    } catch (error) {
      done(error as Error, undefined);
    }
  }
);

app.get("/", async () => ({
  service: "repairloop-api",
  version: serviceVersion,
  docs: "/health, /api/models, /api/match, /api/ai/health, /api/paypal/config"
}));

await app.register(healthRoutes);
await app.register(modelRoutes, { prefix: "/api" });
await app.register(matchRoutes, { prefix: "/api" });
await app.register(aiRoutes, { prefix: "/api" });
await app.register(repairCaseRoutes, { prefix: "/api" });
await app.register(checkoutRoutes, { prefix: "/api" });
await app.register(paypalRoutes, { prefix: "/api" });
await app.register(webhookRoutes, { prefix: "/api" });

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  reply.code(500).send({ error: "internal_error" });
});

const shutdown = async (signal: string): Promise<void> => {
  app.log.info({ signal }, "shutting down");
  await app.close();
  await closeDb();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

await app.listen({ port: env.PORT, host: env.HOST });
