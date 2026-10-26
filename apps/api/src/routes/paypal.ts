import type { FastifyInstance } from "fastify";
import {
  PayPalError,
  getPayPalPublicConfig,
  paypalConfigured
} from "../paypal/client.js";

export async function paypalRoutes(
  app: FastifyInstance
): Promise<void> {
  app.get("/paypal/config", async (request, reply) => {
    if (!paypalConfigured()) {
      return reply.code(503).send({ error: "paypal_not_configured" });
    }

    const origin = request.headers.origin;
    if (!origin) {
      return reply.code(400).send({ error: "origin_required" });
    }

    try {
      return await getPayPalPublicConfig([origin]);
    } catch (error) {
      if (error instanceof PayPalError && error.kind === "not_configured") {
        return reply.code(503).send({ error: "paypal_not_configured" });
      }
      throw error;
    }
  });
}
