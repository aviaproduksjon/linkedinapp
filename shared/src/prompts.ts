/**
 * Prompt loading and versioning.
 *
 * Prompts live under /prompts/<module>/<version>.yaml and are versioned as code.
 * See docs/17-post-genereringsarkitektur.md §8 and prompts/README.md.
 */

import { z } from 'zod';

export const PromptDefinitionSchema = z.object({
  id: z.string(),
  version: z.string(),
  model: z.enum(['opus', 'sonnet', 'haiku']),
  description: z.string(),
  system: z.string(),
  user_template: z.string(),
  /** JSON Schema describing the expected model output. */
  output_schema: z.record(z.unknown()),
  /** Canary cases run on CI whenever this prompt changes. */
  canary_cases: z
    .array(
      z.object({
        name: z.string(),
        input: z.record(z.unknown()),
        assertions: z.array(z.string()),
      }),
    )
    .optional(),
  metadata: z
    .object({
      owner_agent: z.string(),
      created_at: z.string(),
      last_reviewed_at: z.string().optional(),
    })
    .optional(),
});
export type PromptDefinition = z.infer<typeof PromptDefinitionSchema>;

/**
 * Resolve a prompt file path by module and version.
 *
 * @example
 *   promptPath('generator', 'v1') // -> 'prompts/generator/v1.yaml'
 */
export function promptPath(module: string, version: string): string {
  return `prompts/${module}/${version}.yaml`;
}

/**
 * Build the full prompt ID used in suggestion logs and AI usage records.
 *
 * @example
 *   promptId('generator', 'v1') // -> 'generator@v1'
 */
export function promptId(module: string, version: string): string {
  return `${module}@${version}`;
}
