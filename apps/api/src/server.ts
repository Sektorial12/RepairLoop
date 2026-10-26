import Fastify from "fastify";
import cors from "@fastify/cors";
import { corsOrigins, env, serviceVersion } from "./config.js";
import { closeDb } from "./db/client.js";
import { aiRoutes } from "./routes/ai.js";
import { healthRoutes } from "./routes/health.js";
import { matchRoutes } from "./routes/match.js";
import { modelRoutes } from "./routes/models.js";

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

app.get("/", async () => ({
  service: "repairloop-api",
  version: serviceVersion,
  docs: "/health, /api/models, /api/match"
}));

await app.register(healthRoutes);
await app.register(modelRoutes, { prefix: "/api" });
await app.register(matchRoutes, { prefix: "/api" });
await app.register(aiRoutes, { prefix: "/api" });

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
