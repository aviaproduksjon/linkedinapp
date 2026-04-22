/**
 * Typed, validated environment. Throws at module load if something required is
 * missing. Never access process.env directly from app code — import from here.
 */

import { z } from 'zod';

/**
 * Treat empty strings as undefined so optional vars work cleanly whether the
 * variable is absent, commented out, or left blank in .env files.
 */
const optionalString = z
  .union([z.literal(''), z.string().min(1), z.undefined()])
  .transform((v) => (v === '' ? undefined : v));

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  ANTHROPIC_API_KEY: optionalString,
  OPENAI_API_KEY: optionalString,

  CLAUDE_MODEL_OPUS: z.string().default('claude-opus-4-6'),
  CLAUDE_MODEL_SONNET: z.string().default('claude-sonnet-4-6'),
  CLAUDE_MODEL_HAIKU: z.string().default('claude-haiku-4-5'),

  DRY_RUN: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  BUDGET_MONTHLY_CENTS: z.coerce.number().int().default(50_000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = schema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  CLAUDE_MODEL_OPUS: process.env.CLAUDE_MODEL_OPUS,
  CLAUDE_MODEL_SONNET: process.env.CLAUDE_MODEL_SONNET,
  CLAUDE_MODEL_HAIKU: process.env.CLAUDE_MODEL_HAIKU,
  DRY_RUN: process.env.DRY_RUN,
  BUDGET_MONTHLY_CENTS: process.env.BUDGET_MONTHLY_CENTS,
  NODE_ENV: process.env.NODE_ENV,
});
