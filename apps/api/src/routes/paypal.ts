import type { FastifyInstance } from "fastify";
import {
  PayPalError,
  getPayPalPublicConfig,
  paypalConfigured
} from "../paypal/client.js";

export async function paypalRoutes(
  app: FastifyInstance
): Promise<void> {
  app.get("/paypal/config", async (_request, reply) => {
    if (!paypalConfigured()) {
      return reply.code(503).send({ error: "paypal_not_configured" });
    }

    try {
      return getPayPalPublicConfig();
    } catch (error) {
      if (error instanceof PayPalError && error.kind === "not_configured") {
        return reply.code(503).send({ error: "paypal_not_configured" });
      }
      throw error;
    }
  });
}
