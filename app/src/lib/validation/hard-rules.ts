import 'server-only';

/**
 * Hard-rule validation for generated post bodies.
 *
 * The generator is instructed about persona hard_rules in natural language,
 * but we also run a deterministic post-check for the most common slips —
 * things a model can forget under pressure. If any check trips, the
 * suggestion is rejected and the generator re-runs once (see docs/07 §6
 * and docs/17 §3 step 4).
 */

export interface HardRuleViolation {
  rule: string;
  detail?: string;
}

/** AI-cliché opener patterns. Case-insensitive match at the very start. */
const CLICHE_OPENERS: RegExp[] = [
  /^i en verden der\b/i,
  /^i en tid hvor\b/i,
  /^i dagens\b/i,
  /^i det moderne\b/i,
  /^i dag\s*,/i, // "I dag, ..."
  /^i en bransje der\b/i,
  /^i en fremtid der\b/i,
];

/**
 * Run deterministic checks against a post body.
 *
 * @returns List of violations. Empty array means all baseline checks passed.
 * Note: this does NOT try to semantically evaluate every persona hard_rule —
 * only the mechanical ones we can reliably catch. The generator is
 * responsible for the rest.
 */
export function validateBaseline(body: string): HardRuleViolation[] {
  const violations: HardRuleViolation[] = [];

  // Em dash (—) and en dash (–) — both banned.
  if (/—/.test(body)) {
    violations.push({ rule: 'Ingen tankestreker (—)', detail: 'fant em dash' });
  }
  if (/–/.test(body)) {
    violations.push({ rule: 'Ingen tankestreker (–)', detail: 'fant en dash' });
  }

  // Cliché openers.
  const firstLine = body.trimStart().split('\n', 1)[0] ?? '';
  for (const pattern of CLICHE_OPENERS) {
    if (pattern.test(firstLine)) {
      violations.push({
        rule: 'Ingen AI-klisjé-åpninger',
        detail: `åpning matcher "${pattern.source}"`,
      });
      break;
    }
  }

  // Length guardrails. Phase 3 MVP keeps these loose; tuner phase refines.
  const length = body.length;
  if (length < 300) {
    violations.push({
      rule: 'Minimum lengde 300 tegn',
      detail: `${length} tegn`,
    });
  }
  if (length > 3000) {
    violations.push({
      rule: 'Maks lengde 3000 tegn',
      detail: `${length} tegn`,
    });
  }

  return violations;
}

/**
 * Does the body reference at least one of the given hook summaries/urls?
 * We use a loose keyword match: if the body shares at least one 6+ char
 * word with any hook summary, we count it as referenced. For MVP this is
 * enough; a dedicated semantic check can come later.
 */
export function referencesAnyHook(body: string, hooks: { summary: string }[]): boolean {
  if (hooks.length === 0) return true; // Nothing to reference.
  const bodyLower = body.toLowerCase();
  for (const h of hooks) {
    const words = h.summary
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 6);
    for (const w of words) {
      if (bodyLower.includes(w)) return true;
    }
  }
  return false;
}
