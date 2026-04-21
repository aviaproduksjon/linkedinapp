/**
 * Queue names used across the worker. Keep in sync with any producers in the
 * Next.js app (see app/src/lib/queues.ts — not yet written in Phase 1).
 */

export const QUEUES = {
  /** Transcribe an uploaded audio file for an Idea. */
  TRANSCRIBE: 'transcribe',
  /** Post-process an idea after transcription (summary, category suggestions). */
  IDEA_POSTPROCESS: 'idea-postprocess',
  /** Fetch RSS / scrape / report sources. */
  SOURCE_FETCH: 'source-fetch',
  /** Scheduled publishing reminders (half-manual in MVP). */
  PUBLISH_REMINDER: 'publish-reminder',
  /** Pull LinkedIn metrics for a published post. */
  METRIC_FETCH: 'metric-fetch',
  /** Run generator / tuner / filter for a generation request. */
  GENERATE: 'generate',
  /** Halfyearly algorithm insights research job. */
  INSIGHTS_RESEARCH: 'insights-research',
  /** USP extractor from aviaprod.no + web + SoMe. */
  USP_EXTRACT: 'usp-extract',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
