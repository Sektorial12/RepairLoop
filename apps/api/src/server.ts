import Fastify from "fastify";
import type { FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { corsOrigins, env, serviceVersion } from "./config.js";
import { closeDb } from "./db/client.js";
import { aiRoutes } from "./routes/ai.js";
import { catalogRoutes } from "./routes/catalog.js";
import { checkoutRoutes } from "./routes/checkout.js";
import { healthRoutes } from "./routes/health.js";
import { matchRoutes } from "./routes/match.js";
import { modelRoutes } from "./routes/models.js";
import { paypalRoutes } from "./routes/paypal.js";
import { repairCaseRoutes } from "./routes/repair-cases.js";
import { webhookRoutes } from "./routes/webhooks.js";

function rateLimitKey(request: FastifyRequest): string {
  // Trust the Cloudflare header only when Cloudflare is the sole ingress.
  // The direct Render origin otherwise allows a caller to choose the key.
  if (env.TRUST_CLOUDFLARE) {
    const cf = request.headers["cf-connecting-ip"];
    const value = Array.isArray(cf) ? cf[0] : cf;
    if (typeof value === "string" && value.trim()) {
      return `cf:${value.trim()}`;
    }
  }

  return `socket:${request.socket.remoteAddress ?? "unknown"}`;
}

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL
  },
  bodyLimit: 10 * 1024 * 1024
});

await app.register(cors, {
  origin: corsOrigins,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-capture-token"]
});

await app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

await app.register(rateLimit, {
  max: 120,
  timeWindow: "1 minute",
  keyGenerator: rateLimitKey
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
      const parseError = error as Error & { statusCode?: number };
      parseError.statusCode = 400;
      done(parseError, undefined);
    }
  }
);

app.get("/", async () => ({
  service: "repairloop-api",
  version: serviceVersion,
  docs: "/health, /live, /ready, /api/status, /api/models, /api/catalog, /api/match, /api/shop/intake, /api/extract/battery-report, /api/extract/label, /api/symptoms/parse, /api/explain, /api/repair-cases, /api/repair-cases/:id, /api/checkout/orders, /api/checkout/orders/:orderId/capture, /api/orders/:orderId, /api/ai/health, /api/paypal/config, /api/webhooks/paypal"
}));

await app.register(healthRoutes);
await app.register(modelRoutes, { prefix: "/api" });
await app.register(catalogRoutes, { prefix: "/api" });
await app.register(matchRoutes, { prefix: "/api" });
await app.register(aiRoutes, { prefix: "/api" });
await app.register(repairCaseRoutes, { prefix: "/api" });
await app.register(checkoutRoutes, { prefix: "/api" });
await app.register(paypalRoutes, { prefix: "/api" });
await app.register(webhookRoutes, { prefix: "/api" });

app.setErrorHandler((error, request, reply) => {
  const statusCode =
    (error as { statusCode?: number }).statusCode ??
    (error instanceof SyntaxError ? 400 : 500);

  if (statusCode === 429) {
    return reply.code(429).send({ error: "rate_limited" });
  }

  if (statusCode >= 400 && statusCode < 500) {
    request.log.warn({ err: error }, "request error");
    return reply.code(statusCode).send({ error: "invalid_request" });
  }

  request.log.error(error);
  return reply.code(500).send({ error: "internal_error" });
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
