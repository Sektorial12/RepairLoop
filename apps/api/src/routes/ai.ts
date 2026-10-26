import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { env } from "../config.js";
import {
  AiError,
  aiConfigured,
  generateJson,
  type ImageInput
} from "../ai/client.js";
import {
  BATTERY_REPORT_PROMPT,
  LABEL_PROMPT,
  SYMPTOM_PROMPT,
  batteryReportExtractionSchema,
  batteryReportJsonSchema,
  labelExtractionSchema,
  labelJsonSchema,
  symptomExtractionSchema,
  symptomJsonSchema
} from "../ai/schemas.js";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

const ImageBodySchema = z.object({
  imageBase64: z.string().min(64).max(8_000_000),
  mimeType: z.enum(ALLOWED_IMAGE_TYPES).default("image/png")
});

const SymptomBodySchema = z.object({
  text: z.string().min(3).max(2000)
});

function parseImage(input: {
  imageBase64: string;
  mimeType: (typeof ALLOWED_IMAGE_TYPES)[number];
}): ImageInput {
  const dataUrl = input.imageBase64.match(
    /^data:([^;]+);base64,([\s\S]+)$/
  );
  const mimeType = dataUrl?.[1] ?? input.mimeType;
  const base64 = (dataUrl?.[2] ?? input.imageBase64).replace(/\s/g, "");

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
    throw new AiError("invalid_output", "Unsupported image type");
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) {
    throw new AiError("invalid_output", "Empty image");
  }
  if (buffer.length > 6_000_000) {
    throw new AiError("invalid_output", "Image is too large");
  }

  return { base64, mimeType };
}

function sendAiError(
  reply: FastifyReply,
  error: unknown
): FastifyReply {
  if (error instanceof AiError) {
    switch (error.kind) {
      case "not_configured":
        return reply.code(503).send({ error: "ai_not_configured" });
      case "rate_limited":
        return reply.code(429).send({ error: "ai_rate_limited" });
      case "timeout":
        return reply.code(504).send({ error: "ai_timeout" });
      case "invalid_output":
        return reply.code(422).send({
          error: "invalid_ai_output",
          message: error.message
        });
      default:
        return reply.code(502).send({ error: "ai_upstream_error" });
    }
  }

  reply.log.error(error);
  return reply.code(500).send({ error: "internal_error" });
}

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  app.get("/ai/health", async () => ({
    configured: aiConfigured(),
    enabled: env.AI_ENABLED,
    model: env.GEMINI_MODEL
  }));

  app.post("/extract/battery-report", async (request, reply) => {
    if (!aiConfigured()) {
      return reply.code(503).send({ error: "ai_not_configured" });
    }

    const parsed = ImageBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_request",
        issues: parsed.error.issues
      });
    }

    try {
      const image = parseImage(parsed.data);
      const startedAt = Date.now();
      const extraction = await generateJson({
        prompt: BATTERY_REPORT_PROMPT,
        schema: batteryReportJsonSchema,
        validate: batteryReportExtractionSchema,
        image
      });
      request.log.info(
        {
          model: env.GEMINI_MODEL,
          latencyMs: Date.now() - startedAt,
          confidence: extraction.confidence
        },
        "ai_battery_report_extracted"
      );

      return {
        ok: true,
        model: env.GEMINI_MODEL,
        extraction
      };
    } catch (error) {
      return sendAiError(reply, error);
    }
  });

  app.post("/extract/label", async (request, reply) => {
    if (!aiConfigured()) {
      return reply.code(503).send({ error: "ai_not_configured" });
    }

    const parsed = ImageBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_request",
        issues: parsed.error.issues
      });
    }

    try {
      const image = parseImage(parsed.data);
      const startedAt = Date.now();
      const extraction = await generateJson({
        prompt: LABEL_PROMPT,
        schema: labelJsonSchema,
        validate: labelExtractionSchema,
        image
      });
      request.log.info(
        {
          model: env.GEMINI_MODEL,
          latencyMs: Date.now() - startedAt,
          confidence: extraction.confidence
        },
        "ai_label_extracted"
      );

      return {
        ok: true,
        model: env.GEMINI_MODEL,
        extraction
      };
    } catch (error) {
      return sendAiError(reply, error);
    }
  });

  app.post("/symptoms/parse", async (request, reply) => {
    if (!aiConfigured()) {
      return reply.code(503).send({ error: "ai_not_configured" });
    }

    const parsed = SymptomBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_request",
        issues: parsed.error.issues
      });
    }

    try {
      const startedAt = Date.now();
      const extraction = await generateJson({
        prompt: `${SYMPTOM_PROMPT}\n\nUser description:\n${parsed.data.text}`,
        schema: symptomJsonSchema,
        validate: symptomExtractionSchema
      });
      request.log.info(
        {
          model: env.GEMINI_MODEL,
          latencyMs: Date.now() - startedAt,
          confidence: extraction.confidence
        },
        "ai_symptoms_parsed"
      );

      return {
        ok: true,
        model: env.GEMINI_MODEL,
        extraction
      };
    } catch (error) {
      return sendAiError(reply, error);
    }
  });
}
