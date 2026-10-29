import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

// The documented setup puts .env at the repo root; also allow apps/api/.env.
dotenv.config({
  path: path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../.env"
  )
});
dotenv.config();


const boolFromString = z
  .enum(["true", "false"])
  .default("true")
  .transform((value) => value === "true");

const boolFromStringFalse = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3002),
  HOST: z.string().default("127.0.0.1"),
  DATABASE_URL: z.string().min(1).optional(),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://127.0.0.1:3000"),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
  AI_ENABLED: boolFromString,
  PAYPAL_CLIENT_ID: z.string().min(1).optional(),
  PAYPAL_CLIENT_SECRET: z.string().min(1).optional(),
  PAYPAL_API_BASE: z
    .string()
    .url()
    .default("https://api-m.sandbox.paypal.com"),
  PAYPAL_WEBHOOK_ID: z.string().min(1).optional(),
  PAYPAL_LIVE_ENABLED: boolFromStringFalse,
  RECEIPT_TOKEN_SECRET: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(16).optional()
  ),
  DEMO_MODE: boolFromString,
  LOG_LEVEL: z.string().default("info")
});

export const env = EnvSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const serviceVersion = "0.1.0";
