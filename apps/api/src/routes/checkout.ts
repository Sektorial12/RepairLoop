import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest
} from "fastify";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { loadCatalog } from "../catalog/load.js";
import { matchCatalog } from "../catalog/matcher.js";
import { db } from "../db/client.js";
import {
  orders,
  parts,
  paymentEvents,
  repairCases,
  sources
} from "../db/schema.js";
import {
  PayPalError,
  capturePayPalOrder,
  createPayPalOrder
} from "../paypal/client.js";

type Database = NonNullable<typeof db>;
type OrderRow = typeof orders.$inferSelect;

const CreateOrderBodySchema = z.object({
  repairCaseId: z.string().uuid()
});

const CaptureParamsSchema = z.object({
  orderId: z.string().min(1)
});

function sendPayPalError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown
): FastifyReply {
  if (error instanceof PayPalError) {
    if (error.kind === "not_configured") {
      return reply.code(503).send({ error: "paypal_not_configured" });
    }
    if (error.kind === "invalid_state") {
      return reply.code(422).send({
        error: "paypal_invalid_state",
        message: error.message
      });
    }
    return reply.code(502).send({
      error: "paypal_upstream_error",
      status: error.status ?? null,
      debugId: error.debugId ?? null
    });
  }

  request.log.error(error);
  return reply.code(500).send({ error: "internal_error" });
}

async function buildReceipt(
  database: Database,
  order: OrderRow,
  captureId: string,
  amount: string,
  currency: string,
  capturedAt?: string
) {
  if (!order.repairCaseId) {
    throw new Error("Order has no repair case");
  }

  const [repairCase] = await database
    .select()
    .from(repairCases)
    .where(eq(repairCases.id, order.repairCaseId))
    .limit(1);

  if (!repairCase?.selectedPartId) {
    throw new Error("Repair case has no selected part");
  }

  const [part] = await database
    .select()
    .from(parts)
    .where(eq(parts.id, repairCase.selectedPartId))
    .limit(1);

  if (!part) {
    throw new Error("Selected part not found");
  }

  const [source] = await database
    .select()
    .from(sources)
    .where(eq(sources.id, part.sourceId))
    .limit(1);

  return {
    orderId: order.paypalOrderId,
    captureId,
    status: "COMPLETED",
    amount,
    currency,
    partNumber: part.partNumber,
    partName: part.name,
    sourcePublisher: source?.publisher ?? null,
    sourceUrl: source?.url ?? null,
    capturedAt: capturedAt ?? new Date().toISOString()
  };
}

export async function checkoutRoutes(
  app: FastifyInstance
): Promise<void> {
  app.post("/checkout/orders", async (request, reply) => {
    if (!db) {
      return reply.code(503).send({ error: "database_not_configured" });
    }

    const parsed = CreateOrderBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_request",
        issues: parsed.error.issues
      });
    }

    const database = db;

    try {
      const [repairCase] = await database
        .select()
        .from(repairCases)
        .where(eq(repairCases.id, parsed.data.repairCaseId))
        .limit(1);

      if (!repairCase) {
        return reply.code(404).send({ error: "repair_case_not_found" });
      }

      const catalog = await loadCatalog();
      const result = matchCatalog(catalog, {
        modelId: repairCase.modelId ?? undefined,
        installedPartNumber: repairCase.installedPartNumber ?? undefined,
        designCapacityMwh: repairCase.designCapacityMwh ?? undefined,
        fullChargeCapacityMwh:
          repairCase.fullChargeCapacityMwh ?? undefined,
        symptomTags: repairCase.symptomTags
      });

      if (result.status !== "verified_match") {
        return reply.code(422).send({
          error: "selection_no_longer_verified",
          reasons: result.reasons
        });
      }

      const options = [
        ...(result.exact ? [result.exact] : []),
        ...result.lowerCapacity
      ];
      const selected = options.find(
        (option) => option.part.id === repairCase.selectedPartId
      );

      if (!selected) {
        return reply.code(422).send({
          error: "invalid_selection",
          message: "The selected part is no longer a verified option."
        });
      }

      const [existing] = await database
        .select()
        .from(orders)
        .where(eq(orders.repairCaseId, repairCase.id))
        .orderBy(desc(orders.createdAt))
        .limit(1);

      if (existing) {
        if (existing.status === "completed") {
          return reply.code(409).send({
            error: "order_already_completed",
            captureId: existing.paypalCaptureId
          });
        }
        if (
          (existing.status === "created" ||
            existing.status === "approved") &&
          existing.paypalOrderId
        ) {
          return {
            orderId: existing.paypalOrderId,
            amount: existing.amount,
            currency: existing.currency,
            status: existing.status,
            existing: true
          };
        }
      }

      const amount = selected.part.priceDemo;
      const currency = selected.part.currency;
      const origin = request.headers.origin;
      const returnUrl = origin ? `${origin}/check?paypal=return` : undefined;
      const cancelUrl = origin ? `${origin}/check?paypal=cancel` : undefined;
      const paypalOrder = await createPayPalOrder({
        amount,
        currency,
        description: `${selected.part.name} — ${selected.part.partNumber}`,
        customId: `${repairCase.id}|${selected.part.id}`,
        referenceId: selected.part.id,
        requestId: `repairloop-${repairCase.id}`,
        returnUrl,
        cancelUrl
      });

      const [order] = await database
        .insert(orders)
        .values({
          repairCaseId: repairCase.id,
          paypalOrderId: paypalOrder.id,
          amount,
          currency,
          status: "created"
        })
        .returning();

      if (!order) {
        return reply
          .code(500)
          .send({ error: "order_record_create_failed" });
      }

      return {
        orderId: paypalOrder.id,
        orderDbId: order.id,
        amount,
        currency,
        status: "created",
        approvalUrl:
          paypalOrder.links?.find(
            (link) =>
              link.rel === "payer-action" || link.rel === "approve"
          )?.href ?? null
      };
    } catch (error) {
      return sendPayPalError(request, reply, error);
    }
  });

  app.post("/checkout/orders/:orderId/capture", async (request, reply) => {
    if (!db) {
      return reply.code(503).send({ error: "database_not_configured" });
    }

    const parsed = CaptureParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_request",
        issues: parsed.error.issues
      });
    }

    const database = db;

    try {
      const [order] = await database
        .select()
        .from(orders)
        .where(eq(orders.paypalOrderId, parsed.data.orderId))
        .limit(1);

      if (!order) {
        return reply.code(404).send({ error: "order_not_found" });
      }

      if (order.status === "completed" && order.paypalCaptureId) {
        return buildReceipt(
          database,
          order,
          order.paypalCaptureId,
          order.amount ?? "0.00",
          order.currency
        );
      }

      if (!order.paypalOrderId) {
        return reply.code(422).send({ error: "order_missing_paypal_id" });
      }

      const captureResponse = await capturePayPalOrder(
        order.paypalOrderId,
        `repairloop-capture-${order.id}`
      );
      const capture =
        captureResponse.purchase_units?.[0]?.payments?.captures?.[0];

      if (
        captureResponse.status !== "COMPLETED" ||
        !capture ||
        capture.status !== "COMPLETED"
      ) {
        return reply.code(422).send({
          error: "capture_not_completed",
          status: captureResponse.status
        });
      }

      if (
        order.amount !== null &&
        (order.currency !== capture.amount.currency_code ||
          order.amount !== capture.amount.value)
      ) {
        return reply.code(422).send({ error: "amount_mismatch" });
      }

      const [updated] = await database
        .update(orders)
        .set({
          status: "completed",
          paypalCaptureId: capture.id,
          amount: capture.amount.value,
          currency: capture.amount.currency_code
        })
        .where(eq(orders.id, order.id))
        .returning();

      if (!updated) {
        return reply.code(500).send({ error: "order_update_failed" });
      }

      await database
        .insert(paymentEvents)
        .values({
          id: `capture-${capture.id}`,
          orderId: order.id,
          eventType: "PAYMENT.CAPTURE.COMPLETED",
          payload: captureResponse,
          verified: true
        })
        .onConflictDoNothing();

      return buildReceipt(
        database,
        updated,
        capture.id,
        capture.amount.value,
        capture.amount.currency_code,
        capture.create_time
      );
    } catch (error) {
      return sendPayPalError(request, reply, error);
    }
  });

  app.get("/orders/:orderId", async (request, reply) => {
    if (!db) {
      return reply.code(503).send({ error: "database_not_configured" });
    }

    const parsed = CaptureParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_request",
        issues: parsed.error.issues
      });
    }

    const database = db;

    const [order] = await database
      .select()
      .from(orders)
      .where(eq(orders.paypalOrderId, parsed.data.orderId))
      .limit(1);

    if (!order) {
      return reply.code(404).send({ error: "order_not_found" });
    }

    let part:
      | {
          partNumber: string;
          name: string;
          sourcePublisher: string | null;
          sourceUrl: string | null;
        }
      | null = null;

    if (order.repairCaseId) {
      const [repairCase] = await database
        .select()
        .from(repairCases)
        .where(eq(repairCases.id, order.repairCaseId))
        .limit(1);

      if (repairCase?.selectedPartId) {
        const [selectedPart] = await database
          .select()
          .from(parts)
          .where(eq(parts.id, repairCase.selectedPartId))
          .limit(1);

        if (selectedPart) {
          const [source] = await database
            .select()
            .from(sources)
            .where(eq(sources.id, selectedPart.sourceId))
            .limit(1);
          part = {
            partNumber: selectedPart.partNumber,
            name: selectedPart.name,
            sourcePublisher: source?.publisher ?? null,
            sourceUrl: source?.url ?? null
          };
        }
      }
    }

    const events = await database
      .select({
        id: paymentEvents.id,
        eventType: paymentEvents.eventType,
        verified: paymentEvents.verified,
        createdAt: paymentEvents.createdAt
      })
      .from(paymentEvents)
      .where(eq(paymentEvents.orderId, order.id))
      .orderBy(desc(paymentEvents.createdAt));

    return {
      order: {
        id: order.id,
        paypalOrderId: order.paypalOrderId,
        captureId: order.paypalCaptureId,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt
      },
      part,
      events
    };
  });
}
