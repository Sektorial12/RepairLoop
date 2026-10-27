import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { env } from "../config.js";
import {
  AiError,
  aiConfigured,
  generateJson,
  type ImageInput
} from "../ai/client.js";
import { loadCatalog } from "../catalog/load.js";
import { matchCatalog } from "../catalog/matcher.js";
import { db } from "../db/client.js";
import {
  BATTERY_REPORT_PROMPT,
  EXPLANATION_PROMPT,
  LABEL_PROMPT,
  SYMPTOM_PROMPT,
  batteryReportExtractionSchema,
  batteryReportJsonSchema,
  explanationJsonSchema,
  explanationSchema,
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

const ExplainBodySchema = z
  .object({
    modelId: z.string().min(1).optional(),
    modelQuery: z.string().min(1).optional(),
    installedPartNumber: z.string().min(1).optional(),
    designCapacityMwh: z.number().int().positive().optional(),
    fullChargeCapacityMwh: z.number().int().positive().optional(),
    symptomTags: z.array(z.string().min(1)).default([]),
    partId: z.string().min(1)
  })
  .refine((value) => Boolean(value.modelId || value.modelQuery), {
    message: "modelId or modelQuery is required"
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
    enabled: env.AI_ENABLED
  }));

  app.post(
    "/extract/battery-report",
    {
      config: {
        rateLimit: { max: 20, timeWindow: "1 minute" }
      }
    },
    async (request, reply) => {
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
          latencyMs: Date.now() - startedAt,
          confidence: extraction.confidence
        },
        "ai_battery_report_extracted"
      );

      return {
        ok: true,
        extraction
      };
    } catch (error) {
      return sendAiError(reply, error);
    }
  });

  app.post(
    "/extract/label",
    {
      config: {
        rateLimit: { max: 20, timeWindow: "1 minute" }
      }
    },
    async (request, reply) => {
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
          latencyMs: Date.now() - startedAt,
          confidence: extraction.confidence
        },
        "ai_label_extracted"
      );

      return {
        ok: true,
        extraction
      };
    } catch (error) {
      return sendAiError(reply, error);
    }
  });

  app.post(
    "/symptoms/parse",
    {
      config: {
        rateLimit: { max: 20, timeWindow: "1 minute" }
      }
    },
    async (request, reply) => {
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
          latencyMs: Date.now() - startedAt,
          confidence: extraction.confidence
        },
        "ai_symptoms_parsed"
      );

      return {
        ok: true,
        extraction
      };
    } catch (error) {
      return sendAiError(reply, error);
    }
  });

  app.post(
    "/explain",
    {
      config: {
        rateLimit: { max: 20, timeWindow: "1 minute" }
      }
    },
    async (request, reply) => {
      if (!db) {
        return reply.code(503).send({ error: "database_not_configured" });
      }

      if (!aiConfigured()) {
        return reply.code(503).send({ error: "ai_not_configured" });
      }

      const parsed = ExplainBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "invalid_request",
          issues: parsed.error.issues
        });
      }

      const catalog = await loadCatalog();
      const result = matchCatalog(catalog, parsed.data);

      if (result.status !== "verified_match" || !result.model) {
        return reply.code(422).send({
          error: "no_verified_match",
          reasons: result.reasons
        });
      }

      const options = [
        ...(result.exact ? [result.exact] : []),
        ...result.lowerCapacity
      ];
      const selected = options.find(
        (option) => option.part.id === parsed.data.partId
      );

      if (!selected) {
        return reply.code(422).send({
          error: "invalid_selection",
          message: "The selected part is not a verified option for this case."
        });
      }

      const source =
        catalog.sources.find(
          (row) => row.id === selected.compatibility.sourceId
        ) ?? catalog.sources.find((row) => row.id === selected.part.sourceId);

      if (!source) {
        return reply.code(422).send({ error: "source_not_found" });
      }

      const sourceInfo = {
        publisher: source.publisher,
        url: source.url,
        evidenceQuote: selected.compatibility.evidenceQuote ?? null,
        fitmentNote: selected.compatibility.fitmentNote
      };
      const fallback = `${selected.compatibility.fitmentNote} Source: ${source.publisher}.`;
      const evidence = [
        `Confirmed model: ${result.model.brand} ${result.model.model}`,
        `Installed part: ${
          result.installedPart?.partNumber ??
          parsed.data.installedPartNumber ??
          "unknown"
        }`,
        `Selected replacement: ${selected.part.name}; part ${selected.part.partNumber}; ${selected.part.capacityWh}Wh; ${selected.part.voltage}V; ${selected.part.cells}-cell`,
        `Catalog fitment note: ${selected.compatibility.fitmentNote}`,
        `Evidence quote: ${
          selected.compatibility.evidenceQuote ?? "not provided"
        }`,
        `Source publisher: ${source.publisher}`,
        `Source URL: ${source.url}`
      ].join("\n");

      try {
        const startedAt = Date.now();
        const extraction = await generateJson({
          prompt: `${EXPLANATION_PROMPT}\n\nEvidence:\n${evidence}`,
          schema: explanationJsonSchema,
          validate: explanationSchema
        });
        request.log.info(
          {
            latencyMs: Date.now() - startedAt,
            confidence: extraction.confidence
          },
          "ai_match_explained"
        );

        const normalize = (value: string) => value.replace(/\/+$/, "");
        if (normalize(extraction.citedSourceUrl) !== normalize(source.url)) {
          return {
            explanation: fallback,
            source: sourceInfo,
            ai: false,
            grounded: true,
            fallbackReason: "citation_mismatch"
          };
        }

        return {
          explanation: extraction.explanation,
          source: sourceInfo,
          ai: true,
          grounded: true,
          confidence: extraction.confidence
        };
      } catch (error) {
        if (error instanceof AiError && error.kind === "not_configured") {
          return reply.code(503).send({ error: "ai_not_configured" });
        }
        request.log.error(error);
        return {
          explanation: fallback,
          source: sourceInfo,
          ai: false,
          grounded: true,
          fallbackReason: "ai_unavailable"
        };
      }
    }
  );
}
