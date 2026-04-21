/**
 * Domain types shared between app and worker.
 *
 * These are the shapes we pass between modules and into LLM prompts.
 * They are NOT the raw database row types — those are generated from
 * Supabase into db-types.ts via `pnpm db:types`.
 */

import { z } from 'zod';
import {
  CATEGORY_SLUGS,
  CTA_MODES,
  INPUT_TYPES,
  POST_STATUSES,
  SOURCE_TYPES,
} from './constants.js';

// ---------------------------------------------------------------------------
// Persona
// ---------------------------------------------------------------------------

export const PersonaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  active: z.boolean(),
  tone_of_voice: z.string(),
  hard_rules: z.array(z.string()),
  guidance: z.array(z.string()),
  snippets: z.array(z.string()),
  target_audience_notes: z.string().nullable(),
  preference_weights: z.record(z.unknown()).nullable(),
});
export type Persona = z.infer<typeof PersonaSchema>;

// ---------------------------------------------------------------------------
// Hook (knagg) — what the generator works from
// ---------------------------------------------------------------------------

export const HookSchema = z.object({
  id: z.string().uuid(),
  source_type: z.enum(SOURCE_TYPES),
  title: z.string().nullable(),
  summary: z.string(),
  url: z.string().url().nullable(),
  // Populated when source_type === 'idea_bank'
  idea_content: z.string().nullable(),
});
export type Hook = z.infer<typeof HookSchema>;

// ---------------------------------------------------------------------------
// USP
// ---------------------------------------------------------------------------

export const UspSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  proof: z.string().nullable(),
  related_pain_point_ids: z.array(z.string().uuid()),
});
export type Usp = z.infer<typeof UspSchema>;

// ---------------------------------------------------------------------------
// Algorithm insight bullet (used as context into the generator)
// ---------------------------------------------------------------------------

export const AlgorithmInsightContextSchema = z.object({
  version: z.number().int(),
  approved_at: z.string(), // ISO timestamp
  technical: z.array(z.string()),
  b2b_practice: z.array(z.string()),
  cultural: z.array(z.string()),
});
export type AlgorithmInsightContext = z.infer<typeof AlgorithmInsightContextSchema>;

// ---------------------------------------------------------------------------
// Generation request (input contract into the generator)
// ---------------------------------------------------------------------------

export const GenerationRequestSchema = z.object({
  primary_category_id: z.string().uuid(),
  category_ids: z.array(z.string().uuid()).min(1).max(3),
  hooks: z.array(HookSchema).min(1),
  personas_active: z.array(z.string().uuid()).min(1).max(2),
  user_notes: z.string().nullable(),
  pain_point_id: z.string().uuid().nullable(),
  related_usps: z.array(UspSchema),
  language_mirrors: z.array(
    z.object({
      chunk: z.string(),
      topic_tags: z.array(z.string()),
    }),
  ),
  algorithm_insights: AlgorithmInsightContextSchema.nullable(),
  cta_mode: z.enum(CTA_MODES),
  requested_count_per_persona: z.number().int().min(1).max(4),
});
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;

// ---------------------------------------------------------------------------
// Suggestion (output contract from the generator)
// ---------------------------------------------------------------------------

export const SuggestionSchema = z.object({
  id: z.string().uuid(),
  generation_id: z.string().uuid(),
  persona_id: z.string().uuid(),
  body: z.string(),
  algorithm_score: z.number().min(0).max(1).nullable(),
  algorithm_notes: z.string().nullable(),
  prompt_version: z.string(),
  model: z.string(),
  tuner_diff: z
    .object({
      pre_tuning_body: z.string(),
      post_tuning_body: z.string(),
      changes: z.array(z.string()),
      pre_score: z.number(),
      post_score: z.number(),
    })
    .nullable(),
});
export type Suggestion = z.infer<typeof SuggestionSchema>;

// ---------------------------------------------------------------------------
// Post status helper
// ---------------------------------------------------------------------------

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
export type InputType = (typeof INPUT_TYPES)[number];
export type PostStatus = (typeof POST_STATUSES)[number];
