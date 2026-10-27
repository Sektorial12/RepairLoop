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
import { nextOrderStatus } from "../paypal/webhook-state.js";

interface WebhookEvent {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
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
  app.post(
    "/webhooks/paypal",
    {
      config: { rateLimit: false }
    },
    async (request, reply) => {
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

      const eventId = event.id ?? randomUUID();
      const payload = {
        id: eventId,
        event_type: eventType,
        resource: {
          id: resource.id ?? null,
          status: resource.status ?? null,
          amount: resource.amount
            ? {
                value: resource.amount.value ?? null,
                currency_code: resource.amount.currency_code ?? null
              }
            : null,
          supplementary_data: resource.supplementary_data ?? null
        }
      };

      const result = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(paymentEvents)
          .values({
            id: eventId,
            orderId: order?.id ?? null,
            eventType,
            payload,
            verified: true
          })
          .onConflictDoNothing()
          .returning({ id: paymentEvents.id });

        if (!inserted) {
          return { duplicate: true };
        }

        if (order) {
          const next = nextOrderStatus(order.status, eventType);

          if (next) {
            const update: {
              status: string;
              paypalCaptureId?: string | null;
              amount?: string;
              currency?: string;
            } = { status: next };

            if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
              if (resource.id) update.paypalCaptureId = resource.id;
              if (resource.amount?.value) {
                update.amount = resource.amount.value;
              }
              if (resource.amount?.currency_code) {
                update.currency = resource.amount.currency_code;
              }
            }

            await tx
              .update(orders)
              .set(update)
              .where(eq(orders.id, order.id));
          }
        }

        return { duplicate: false };
      });

      return { received: true, duplicate: result.duplicate };
    }
  );
}
