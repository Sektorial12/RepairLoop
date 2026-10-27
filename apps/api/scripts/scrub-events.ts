import { eq } from "drizzle-orm";
import { closeDb, db } from "../src/db/client.js";
import { paymentEvents } from "../src/db/schema.js";

if (!db) {
  console.error("DATABASE_URL is required to scrub payment events.");
  process.exit(1);
}

type StoredEvent = {
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
  snapshot?: unknown;
  capture?: unknown;
};

const database = db;

try {
  const rows = await database.select().from(paymentEvents);

  for (const row of rows) {
    const payload = (row.payload ?? {}) as StoredEvent;
    const amount = payload.resource?.amount;

    await database
      .update(paymentEvents)
      .set({
        payload: {
          id: payload.id ?? row.id,
          event_type: payload.event_type ?? row.eventType,
          resource: {
            id: payload.resource?.id ?? null,
            status: payload.resource?.status ?? null,
            amount: amount
              ? {
                  value: amount.value ?? null,
                  currency_code: amount.currency_code ?? null
                }
              : null,
            supplementary_data: payload.resource?.supplementary_data?.related_ids
              ?.order_id
              ? {
                  related_ids: {
                    order_id: payload.resource.supplementary_data.related_ids.order_id
                  }
                }
              : null
          },
          snapshot: payload.snapshot ?? null,
          capture: payload.capture ?? null
        }
      })
      .where(eq(paymentEvents.id, row.id));
  }

  console.log(`Scrubbed ${rows.length} payment-event payloads to metadata only.`);
} catch (error) {
  console.error("Payment-event scrub failed:", error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
