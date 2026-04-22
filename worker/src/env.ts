import { z } from 'zod';

const optionalString = z
  .union([z.literal(''), z.string().min(1), z.undefined()])
  .transform((v) => (v === '' ? undefined : v));

const schema = z.object({
  REDIS_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: optionalString,
  OPENAI_API_KEY: optionalString,
  DRY_RUN: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export const env = schema.parse(process.env);
