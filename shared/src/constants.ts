/**
 * Domain constants. Keep in sync with the Supabase enums in
 * supabase/migrations/0001_initial_schema.sql.
 */

export const CATEGORY_SLUGS = [
  'give-value',
  'slik-tenker-vi',
  'hjelpe-markedssjefer',
  'vise-suksess',
] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const CTA_MODES = ['none', 'soft', 'direct'] as const;
export type CtaMode = (typeof CTA_MODES)[number];

export const POST_STATUSES = [
  'draft',
  'suggested',
  'approved',
  'scheduled',
  'published',
  'failed',
  'archived',
] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const SOURCE_TYPES = [
  'rss',
  'scrape',
  'manual',
  'internal_avia',
  'report',
  'idea_bank',
  'web_search',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const IDEA_STATUSES = ['new', 'refined', 'used', 'archived'] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const HOOK_STATUSES = ['new', 'reviewed', 'used', 'archived'] as const;
export type HookStatus = (typeof HOOK_STATUSES)[number];

export const ATTACHMENT_TYPES = ['image', 'carousel_slide', 'document'] as const;
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

export const ALGORITHM_INSIGHT_SECTIONS = ['technical', 'b2b_practice', 'cultural'] as const;
export type AlgorithmInsightSection = (typeof ALGORITHM_INSIGHT_SECTIONS)[number];

export const AI_USAGE_MODULES = [
  'generator',
  'tuner',
  'filter',
  'evaluator',
  'research',
  'usp_extractor',
  'transcription',
  'idea_postprocess',
  'text_polisher',
  'marketer_review',
  'classifier',
] as const;
export type AiUsageModule = (typeof AI_USAGE_MODULES)[number];

export const INPUT_TYPES = ['text', 'voice'] as const;
export type InputType = (typeof INPUT_TYPES)[number];

/**
 * Algorithm filter score thresholds.
 * See docs/13-algoritmefilter-tuner.md.
 */
export const SCORE_THRESHOLDS = {
  BLOCK_BELOW: 0.25,
  TUNE_BETWEEN: [0.25, 0.7] as const,
  GOOD_ENOUGH: 0.7,
  IDEAL: 0.85,
} as const;

/**
 * Default N suggestions per active persona.
 * See docs/07-generering.md.
 */
export const SUGGESTIONS_PER_PERSONA = 2;

/**
 * LinkedIn post character targets.
 */
export const POST_LENGTH = {
  MIN: 300,
  TARGET_MIN: 1200,
  TARGET_MAX: 1800,
  MAX: 3000,
} as const;

/**
 * Budget defaults.
 */
export const BUDGET = {
  DEFAULT_MONTHLY_CENTS: 50_000, // 500 NOK in øre
  WARN_PERCENT: 80,
  HARD_STOP_PERCENT: 100,
} as const;
