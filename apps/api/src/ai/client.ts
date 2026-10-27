import { GoogleGenAI } from "@google/genai";
import type { Part, Schema } from "@google/genai";
import { env } from "../config.js";

export type AiErrorKind =
  | "not_configured"
  | "timeout"
  | "rate_limited"
  | "invalid_output"
  | "upstream";

export class AiError extends Error {
  constructor(
    public readonly kind: AiErrorKind,
    message: string
  ) {
    super(message);
    this.name = "AiError";
  }
}

export interface ImageInput {
  base64: string;
  mimeType: string;
}

let client: GoogleGenAI | null = null;

export function aiConfigured(): boolean {
  return Boolean(
    env.AI_ENABLED && env.GEMINI_API_KEY && env.GEMINI_MODEL
  );
}

function getClient(): GoogleGenAI | null {
  if (!aiConfigured()) return null;
  client ??= new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
    httpOptions: { timeout: 30000 }
  });
  return client;
}

function isRetryable(error: unknown): boolean {
  const value = error as { status?: number; code?: number; message?: string };
  const status = value.status ?? value.code;
  return (
    status === 429 ||
    status === 503 ||
    /rate limit|resource_exhausted|unavailable|try again/i.test(
      value.message ?? ""
    )
  );
}

function mapError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  const value = error as { status?: number; code?: number; message?: string };
  const status = value.status ?? value.code;
  if (status === 429) {
    return new AiError("rate_limited", "Gemini rate limit reached");
  }
  if (status === 504) {
    return new AiError("timeout", "Gemini request timed out");
  }
  return new AiError(
    "upstream",
    value.message ? `Gemini error: ${value.message}` : "Gemini request failed"
  );
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function generateJson<T>({
  prompt,
  schema,
  validate,
  image,
  timeoutMs = 35000
}: {
  prompt: string;
  schema: Schema;
  validate: { parse: (value: unknown) => T };
  image?: ImageInput;
  timeoutMs?: number;
}): Promise<T> {
  const ai = getClient();
  if (!ai) {
    throw new AiError("not_configured", "Gemini is not configured");
  }

  const model = env.GEMINI_MODEL;
  if (!model) {
    throw new AiError("not_configured", "Gemini model is not configured");
  }

  const parts: Part[] = [{ text: prompt }];
  if (image) {
    parts.push({
      inlineData: {
        data: image.base64,
        mimeType: image.mimeType
      }
    });
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const call = ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0
        }
      });

      const timeout = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new AiError("timeout", "Gemini request timed out")),
          timeoutMs
        );
      });

      const response = await Promise.race([call, timeout]);
      const text = response.text;
      if (!text) {
        throw new AiError("invalid_output", "Gemini returned an empty response");
      }

      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new AiError("invalid_output", "Gemini returned invalid JSON");
      }

      try {
        return validate.parse(json);
      } catch (error) {
        throw new AiError(
          "invalid_output",
          error instanceof Error
            ? `Gemini output failed validation: ${error.message}`
            : "Gemini output failed validation"
        );
      }
    } catch (error) {
      lastError = error;
      if (attempt === 0 && isRetryable(error)) {
        await sleep(900);
        continue;
      }
      throw mapError(error);
    }
  }

  throw mapError(lastError);
}
