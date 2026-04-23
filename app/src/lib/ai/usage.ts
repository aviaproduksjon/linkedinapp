import 'server-only';
import { estimateCostCents, type AiUsageModule } from '@linkedin-hub/shared';
import { createClient } from '@/lib/supabase/server';

export interface LogUsageArgs {
  userId: string;
  model: string;
  module: AiUsageModule;
  input_tokens: number;
  output_tokens: number;
  ref_type?: string;
  ref_id?: string;
  prompt_version?: string;
}

/**
 * Log a single AI call to ai_usage. Non-blocking — failures are logged but
 * never thrown; a missing usage row must not break the user flow.
 */
export async function logAiUsage(args: LogUsageArgs): Promise<void> {
  try {
    const supabase = createClient();
    const cost_cents = estimateCostCents(args);
    await supabase.from('ai_usage').insert({
      user_id: args.userId,
      model: args.model,
      module: args.module,
      input_tokens: args.input_tokens,
      output_tokens: args.output_tokens,
      cost_cents,
      ref_type: args.ref_type ?? null,
      ref_id: args.ref_id ?? null,
      prompt_version: args.prompt_version ?? null,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[ai_usage] failed to log:', err);
  }
}
