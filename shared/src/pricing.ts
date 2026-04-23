/**
 * Model pricing in USD per million tokens.
 * Used to estimate cost_cents (in NOK øre) for AIUsage records.
 *
 * Update when Anthropic/OpenAI publishes new prices.
 *
 * NOK conversion rate is approximate — we don't need exact accounting for the
 * budget panel, only order-of-magnitude.
 */

export const USD_TO_NOK = 10.5;

/** input $ / 1M tokens, output $ / 1M tokens */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6': { input: 15.0, output: 75.0 },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5': { input: 1.0, output: 5.0 },
  // OpenAI Whisper charges per audio-minute, not tokens. Treat 1 minute = 1 "unit".
  'whisper-1': { input: 0.006 * 1_000_000, output: 0 }, // Encoded as "per 1M units" to reuse math.
};

export interface UsageInput {
  model: string;
  input_tokens: number;
  output_tokens: number;
}

/**
 * Estimate cost in NOK øre (integer). Returns 0 if the model is unknown —
 * the caller should still log the usage so we can notice missing pricing.
 */
export function estimateCostCents({ model, input_tokens, output_tokens }: UsageInput): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  const usd = (input_tokens * pricing.input) / 1_000_000 + (output_tokens * pricing.output) / 1_000_000;
  const nok = usd * USD_TO_NOK;
  return Math.round(nok * 100); // NOK to øre
}
