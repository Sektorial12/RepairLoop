import type { FastifyInstance, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { orders, paymentEvents } from "../db/schema.js";
import {
  PayPalError,
  paypalConfigured,
  verifyPayPalWebhook
} from "../paypal/client.js";

interface WebhookEvent {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    amount?: {
      value?: string;
      currency_code?: string;
    };
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
  };
}

export async function webhookRoutes(
  app: FastifyInstance
): Promise<void> {
  app.post("/webhooks/paypal", async (request, reply) => {
    if (!db) {
      return reply.code(503).send({ error: "database_not_configured" });
    }

    if (!paypalConfigured()) {
      return reply.code(503).send({ error: "paypal_not_configured" });
    }

    const rawBody = (
      request as FastifyRequest & { rawBody?: Buffer }
    ).rawBody;

    if (!rawBody) {
      return reply.code(400).send({ error: "missing_raw_body" });
    }

    try {
      const verified = await verifyPayPalWebhook({
        headers: request.headers as Record<
          string,
          string | string[] | undefined
        >,
        rawBody
      });

      if (!verified) {
        return reply.code(400).send({ error: "invalid_signature" });
      }
    } catch (error) {
      if (error instanceof PayPalError && error.kind === "not_configured") {
        return reply.code(503).send({ error: "webhook_not_configured" });
      }
      request.log.error(error);
      return reply.code(400).send({ error: "webhook_verification_failed" });
    }

    const event = request.body as WebhookEvent;
    const eventType = event.event_type ?? "UNKNOWN";
    const resource = event.resource ?? {};
    const orderId =
      eventType === "CHECKOUT.ORDER.APPROVED"
        ? resource.id
        : resource.supplementary_data?.related_ids?.order_id;

    let order: typeof orders.$inferSelect | undefined;

    if (orderId) {
      [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.paypalOrderId, orderId))
        .limit(1);
    }

    if (order) {
      if (eventType === "CHECKOUT.ORDER.APPROVED") {
        await db
          .update(orders)
          .set({ status: "approved" })
          .where(eq(orders.id, order.id));
      }

      if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
        await db
          .update(orders)
          .set({
            status: "completed",
            paypalCaptureId: resource.id ?? null,
            amount: resource.amount?.value ?? order.amount,
            currency: resource.amount?.currency_code ?? order.currency
          })
          .where(eq(orders.id, order.id));
      }

      if (eventType === "PAYMENT.CAPTURE.DENIED") {
        await db
          .update(orders)
          .set({ status: "denied" })
          .where(eq(orders.id, order.id));
      }

      if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
        await db
          .update(orders)
          .set({ status: "refunded" })
          .where(eq(orders.id, order.id));
      }
    }

    await db
      .insert(paymentEvents)
      .values({
        id: event.id ?? randomUUID(),
        orderId: order?.id ?? null,
        eventType,
        payload: event,
        verified: true
      })
      .onConflictDoNothing();

    return { received: true };
  });
}
