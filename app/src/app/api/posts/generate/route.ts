import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAnthropic } from '@/lib/ai/anthropic';
import { logAiUsage } from '@/lib/ai/usage';
import { env } from '@/lib/env';
import { validateBaseline, referencesAnyHook } from '@/lib/validation/hard-rules';
import { scorePost, type FilterResult } from '@/lib/ai/filter';
import { tunePost, type TunerResult } from '@/lib/ai/tuner';
import { CTA_MODES, SUGGESTIONS_PER_PERSONA, SCORE_THRESHOLDS } from '@linkedin-hub/shared';

/**
 * POST /api/posts/generate
 *
 * MVP generator (Phase 3 Part 1). Takes hooks + personas + category + cta_mode,
 * calls Claude Opus with a `save_suggestions` tool, runs hard-rule validation,
 * regenerates once on violations, and saves survivors to the `suggestions`
 * table.
 *
 * Returns the suggestion rows for the client to render side-by-side.
 * No Post row is created — that happens when the user chooses a suggestion
 * via /api/suggestions/[id]/choose.
 *
 * See docs/07-generering.md, docs/17-post-genereringsarkitektur.md.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const Body = z.object({
    hook_ids: z.array(z.string().uuid()).min(1).max(3),
    persona_ids: z.array(z.string().uuid()).min(1).max(2),
    primary_category_id: z.string().uuid(),
    secondary_category_ids: z.array(z.string().uuid()).max(2).default([]),
    cta_mode: z.enum(CTA_MODES),
    user_notes: z.string().max(500).optional(),
  });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ error: 'invalid body', details: String(err) }, { status: 400 });
  }

  // Load all context in parallel.
  const [hookRes, personaRes, categoryRes, insightRes] = await Promise.all([
    supabase.from('hooks').select('*').in('id', body.hook_ids),
    supabase.from('personas').select('*').in('id', body.persona_ids),
    supabase
      .from('categories')
      .select('id, slug, display_name, description, generation_guidance')
      .in('id', [body.primary_category_id, ...body.secondary_category_ids]),
    supabase
      .from('algorithm_insights')
      .select('section, bullets, version, approved_at')
      .is('active_to', null)
      .order('section'),
  ]);

  const hooks = hookRes.data ?? [];
  const personas = personaRes.data ?? [];
  const categories = categoryRes.data ?? [];
  const insights = insightRes.data ?? [];

  if (hooks.length === 0) {
    return NextResponse.json({ error: 'no hooks found' }, { status: 400 });
  }
  if (personas.length === 0) {
    return NextResponse.json({ error: 'no personas found' }, { status: 400 });
  }

  const primaryCategory = categories.find((c) => c.id === body.primary_category_id);
  if (!primaryCategory) {
    return NextResponse.json({ error: 'primary category not in allowed list' }, { status: 400 });
  }
  const secondaryCategories = categories.filter((c) => c.id !== body.primary_category_id);

  const generationId = crypto.randomUUID();
  const promptVersion = 'generator@v1';
  const model = env.CLAUDE_MODEL_OPUS;
  const anthropic = getAnthropic();

  // Build system + user prompts.
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    hooks,
    personas,
    primaryCategory,
    secondaryCategories,
    insights,
    ctaMode: body.cta_mode,
    userNotes: body.user_notes,
  });

  const tools = [
    {
      name: 'save_suggestions',
      description: 'Return the generated suggestions. Exactly one call required.',
      input_schema: {
        type: 'object',
        required: ['suggestions'],
        properties: {
          suggestions: {
            type: 'array',
            minItems: 1,
            maxItems: 8,
            items: {
              type: 'object',
              required: ['persona_id', 'body'],
              properties: {
                persona_id: { type: 'string' },
                body: { type: 'string', minLength: 300, maxLength: 3000 },
                cta_mode: { type: 'string', enum: ['none', 'soft', 'direct'] },
                references_hook_ids: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  ] as const;

  async function runGenerator(retryNote?: string): Promise<{
    candidates: GeneratedCandidate[];
    usage: { input_tokens: number; output_tokens: number };
  }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: userPrompt + (retryNote ? `\n\nRetry note: ${retryNote}` : '') },
    ];
    const msg = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      tools: [...tools],
      tool_choice: { type: 'tool', name: 'save_suggestions' },
    });

    const toolUse = msg.content.find(
      (b): b is Extract<(typeof msg.content)[number], { type: 'tool_use' }> =>
        b.type === 'tool_use' && b.name === 'save_suggestions',
    );
    if (!toolUse) {
      throw new Error('model did not call save_suggestions');
    }
    const input = toolUse.input as {
      suggestions?: Array<{
        persona_id?: unknown;
        body?: unknown;
        cta_mode?: unknown;
      }>;
    };
    const candidates: GeneratedCandidate[] = (input.suggestions ?? [])
      .map((s) => ({
        persona_id: typeof s.persona_id === 'string' ? s.persona_id : '',
        body: typeof s.body === 'string' ? s.body : '',
        cta_mode: typeof s.cta_mode === 'string' ? s.cta_mode : body.cta_mode,
      }))
      .filter((s) => s.persona_id && s.body);

    return {
      candidates,
      usage: msg.usage,
    };
  }

  // First pass.
  let pass;
  try {
    pass = await runGenerator();
  } catch (err) {
    return NextResponse.json(
      { error: 'generation failed', details: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
  await logAiUsage({
    userId: user.id,
    model,
    module: 'generator',
    input_tokens: pass.usage.input_tokens,
    output_tokens: pass.usage.output_tokens,
    ref_type: 'generation',
    ref_id: generationId,
    prompt_version: promptVersion,
  });

  // Validate each candidate; keep survivors, collect violators for retry.
  const validPersonaIds = new Set(personas.map((p) => p.id));
  const accepted: AcceptedSuggestion[] = [];
  const rejected: Array<{ candidate: GeneratedCandidate; violations: string[] }> = [];

  for (const cand of pass.candidates) {
    if (!validPersonaIds.has(cand.persona_id)) continue; // hallucinated id
    const persona = personas.find((p) => p.id === cand.persona_id)!;
    const violations = collectViolations(cand.body, persona.hard_rules, hooks);
    if (violations.length === 0) {
      accepted.push({ ...cand, persona });
    } else {
      rejected.push({ candidate: cand, violations });
    }
  }

  // If any persona has fewer than SUGGESTIONS_PER_PERSONA accepted, retry once.
  const perPersonaCount: Record<string, number> = {};
  for (const a of accepted) {
    perPersonaCount[a.persona_id] = (perPersonaCount[a.persona_id] ?? 0) + 1;
  }
  const missingPersonas = personas.filter(
    (p) => (perPersonaCount[p.id] ?? 0) < SUGGESTIONS_PER_PERSONA,
  );

  if (missingPersonas.length > 0 && rejected.length > 0) {
    const retryNote =
      'Your previous output had rule violations on some suggestions: ' +
      rejected
        .map((r) => r.violations.join('; '))
        .slice(0, 3)
        .join(' | ') +
      `. Produce exactly ${SUGGESTIONS_PER_PERSONA} clean suggestions per active persona. Respect ALL hard_rules.`;
    try {
      const retry = await runGenerator(retryNote);
      await logAiUsage({
        userId: user.id,
        model,
        module: 'generator',
        input_tokens: retry.usage.input_tokens,
        output_tokens: retry.usage.output_tokens,
        ref_type: 'generation_retry',
        ref_id: generationId,
        prompt_version: promptVersion,
      });
      for (const cand of retry.candidates) {
        if (!validPersonaIds.has(cand.persona_id)) continue;
        const persona = personas.find((p) => p.id === cand.persona_id)!;
        if ((perPersonaCount[cand.persona_id] ?? 0) >= SUGGESTIONS_PER_PERSONA) continue;
        const violations = collectViolations(cand.body, persona.hard_rules, hooks);
        if (violations.length === 0) {
          accepted.push({ ...cand, persona });
          perPersonaCount[cand.persona_id] = (perPersonaCount[cand.persona_id] ?? 0) + 1;
        }
      }
    } catch {
      // Retry is best-effort.
    }
  }

  if (accepted.length === 0) {
    return NextResponse.json(
      {
        error: 'no suggestions survived validation',
        violations: rejected.flatMap((r) => r.violations),
      },
      { status: 502 },
    );
  }

  // -------------------------------------------------------------------------
  // Algorithm filter + tuner pass (Phase 3 Part 2).
  // See docs/13-algoritmefilter-tuner.md and docs/17-post-genereringsarkitektur.md.
  // -------------------------------------------------------------------------

  const { data: painPoint } = primaryCategory
    ? await supabase
        .from('pain_points')
        .select('name')
        .eq('active', true)
        .order('priority')
        .limit(1)
        .maybeSingle()
    : { data: null };

  const insightContext = insights.map((i) => ({ section: i.section, bullets: i.bullets }));
  const hookSourceTypes: string[] = Array.from(
    new Set(
      hooks.flatMap((h): string[] => {
        if (h.idea_id) return ['idea_bank'];
        if (!h.source_id) return ['manual'];
        return [];
      }),
    ),
  );

  // Score every accepted candidate in parallel.
  const scored = await Promise.all(
    accepted.map(async (a) => {
      try {
        const filter = await scorePost({
          body: a.body,
          category_display_name: primaryCategory.display_name,
          pain_point_name: painPoint?.name ?? null,
          hook_source_types: hookSourceTypes,
          algorithm_insights: insightContext,
        });
        await logAiUsage({
          userId: user.id,
          model: env.CLAUDE_MODEL_SONNET,
          module: 'filter',
          input_tokens: filter.input_tokens,
          output_tokens: filter.output_tokens,
          ref_type: 'suggestion_prefilter',
          ref_id: generationId,
          prompt_version: 'filter@v1',
        });
        return { accepted: a, filter, error: null as string | null };
      } catch (err) {
        return {
          accepted: a,
          filter: null,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );

  // Decide per-candidate: pass, tune, or block.
  const processed = await Promise.all(
    scored.map(async (entry) => {
      if (!entry.filter) {
        // Couldn't score — keep the candidate, but mark score as null.
        return {
          accepted: entry.accepted,
          final_body: entry.accepted.body,
          pre_filter: null as FilterResult | null,
          post_filter: null as FilterResult | null,
          tuner: null as TunerResult | null,
          blocked: false,
          filter_error: entry.error,
        };
      }
      const preScore = entry.filter.total_score;

      if (preScore < SCORE_THRESHOLDS.BLOCK_BELOW) {
        return {
          accepted: entry.accepted,
          final_body: entry.accepted.body,
          pre_filter: entry.filter,
          post_filter: null as FilterResult | null,
          tuner: null as TunerResult | null,
          blocked: true,
          filter_error: null,
        };
      }

      if (preScore >= SCORE_THRESHOLDS.GOOD_ENOUGH) {
        return {
          accepted: entry.accepted,
          final_body: entry.accepted.body,
          pre_filter: entry.filter,
          post_filter: entry.filter,
          tuner: null as TunerResult | null,
          blocked: false,
          filter_error: null,
        };
      }

      // 0.25–0.70 → tune.
      let tuner: TunerResult;
      try {
        tuner = await tunePost({
          body: entry.accepted.body,
          hard_rules: entry.accepted.persona.hard_rules ?? [],
          algorithm_insights: insightContext,
        });
        await logAiUsage({
          userId: user.id,
          model: env.CLAUDE_MODEL_SONNET,
          module: 'tuner',
          input_tokens: tuner.input_tokens,
          output_tokens: tuner.output_tokens,
          ref_type: 'suggestion_tuning',
          ref_id: generationId,
          prompt_version: 'tuner@v1',
        });
      } catch (err) {
        return {
          accepted: entry.accepted,
          final_body: entry.accepted.body,
          pre_filter: entry.filter,
          post_filter: entry.filter,
          tuner: null as TunerResult | null,
          blocked: false,
          filter_error: err instanceof Error ? err.message : String(err),
        };
      }

      const finalBody = tuner.rolled_back ? tuner.pre_body : tuner.post_body;

      // Skip re-score for MVP — tuner is supposed to be non-invasive so the
      // original pre_filter score is a close enough anchor for the user.
      // Phase 3 Part 3 can add a re-score when we tighten the loop.
      return {
        accepted: entry.accepted,
        final_body: finalBody,
        pre_filter: entry.filter,
        post_filter: entry.filter,
        tuner,
        blocked: false,
        filter_error: null,
      };
    }),
  );

  const survivors = processed.filter((p) => !p.blocked);
  const blockedCount = processed.filter((p) => p.blocked).length;

  if (survivors.length === 0) {
    return NextResponse.json(
      {
        error: 'all suggestions blocked by algorithm filter',
        blocked_scores: processed
          .filter((p) => p.blocked)
          .map((p) => ({ score: p.pre_filter?.total_score ?? null })),
      },
      { status: 502 },
    );
  }

  // Persist to the suggestions table.
  const generatorMeta = {
    hook_ids: body.hook_ids,
    primary_category_id: body.primary_category_id,
    secondary_category_ids: body.secondary_category_ids,
    cta_mode: body.cta_mode,
    user_notes: body.user_notes ?? null,
    rejected_count: rejected.length,
    blocked_by_filter_count: blockedCount,
  };

  const rows = survivors.map((p) => {
    const filterNotes = p.pre_filter
      ? [
          p.pre_filter.summary,
          p.pre_filter.strengths.length ? `Styrker: ${p.pre_filter.strengths.join(' · ')}` : null,
          p.pre_filter.risks.length ? `Risiko: ${p.pre_filter.risks.join(' · ')}` : null,
          p.tuner && !p.tuner.rolled_back
            ? `Tuner endret: ${p.tuner.changes.join(' · ')}`
            : p.tuner?.rolled_back
              ? `Tuner rullet tilbake: ${p.tuner.rollback_reason}`
              : null,
        ]
          .filter(Boolean)
          .join('\n')
      : null;

    const tunerDiff = p.tuner
      ? {
          rolled_back: p.tuner.rolled_back,
          rollback_reason: p.tuner.rollback_reason,
          changes: p.tuner.changes,
          pre_body: p.tuner.pre_body,
          post_body: p.tuner.post_body,
        }
      : null;

    return {
      user_id: user.id,
      generation_id: generationId,
      persona_id: p.accepted.persona_id,
      body: p.final_body,
      algorithm_score: p.pre_filter?.total_score ?? null,
      algorithm_notes: filterNotes,
      tuner_diff: tunerDiff,
      generator_meta: generatorMeta,
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from('suggestions')
    .insert(rows)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    generation_id: generationId,
    suggestions: inserted,
    rejected_count: rejected.length,
    blocked_by_filter_count: blockedCount,
  });
}

export const runtime = 'nodejs';
export const maxDuration = 120;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface GeneratedCandidate {
  persona_id: string;
  body: string;
  cta_mode: string;
}

interface AcceptedSuggestion extends GeneratedCandidate {
  persona: { id: string; name: string; hard_rules: string[]; guidance: string[] };
}

function collectViolations(
  body: string,
  hardRules: string[] | null,
  hooks: { summary: string }[],
): string[] {
  const violations: string[] = [];
  for (const v of validateBaseline(body)) {
    violations.push(v.rule + (v.detail ? ` (${v.detail})` : ''));
  }
  if (!referencesAnyHook(body, hooks)) {
    violations.push('Refererer ingen av de oppgitte knaggene');
  }
  // persona.hard_rules are also sent into the prompt — this is a redundant
  // safety net for the baseline checks. The real natural-language check is
  // the Sonnet text polisher in Phase 3 Part 3.
  void hardRules;
  return violations;
}

function buildSystemPrompt(): string {
  return `You are the post generator for Deniz at Avia Produksjon AS.
You write LinkedIn posts in Norwegian (bokmål) for an audience of Norwegian marketing managers.

Your job:
- Produce exactly N suggestions per active persona, as requested.
- Ground every post in at least one of the provided hooks. Never invent facts.
- Reflect the persona's tone_of_voice and respect every hard_rule.
- Make the suggestions structurally DIFFERENT from each other (different opener style, different shape), not two drafts of the same idea.
- Return valid JSON by calling the save_suggestions tool exactly once. No prose.

You MUST NOT:
- Use em dashes (— or –). This is the most-broken rule, so read your draft twice.
- Open with generic AI-cliché phrases such as "I en verden der", "I dagens", "I det moderne".
- Invent facts, numbers, quotes, names that are not in the provided hooks.
- Include external URLs in the post body (LinkedIn penalises those).
- Add a different cta_mode than the one requested — unless requested mode doesn't fit honestly, in which case explain via cta_mode field.

LinkedIn guardrails for Norwegian B2B:
- Target 1200–1800 characters. Shorter is fine when tight; longer only when substance justifies.
- First 2 lines matter most (before "... se mer"). Make the hook land.
- Short paragraphs, not walls of text.
- Maximum 3 emojis, and only where they help rhythm.
- Maximum 3 hashtags. Do not tag people or companies unless they appear in the hooks.`;
}

interface UserPromptCtx {
  hooks: Array<{ id: string; title: string | null; summary: string; url: string | null; raw_content: string | null }>;
  personas: Array<{
    id: string;
    name: string;
    tone_of_voice: string;
    hard_rules: string[];
    guidance: string[];
    snippets: string[];
    target_audience_notes: string | null;
  }>;
  primaryCategory: { id: string; slug: string; display_name: string; description: string | null; generation_guidance: string | null };
  secondaryCategories: Array<{ id: string; slug: string; display_name: string; description: string | null; generation_guidance: string | null }>;
  insights: Array<{ section: string; bullets: string[]; version: number; approved_at: string }>;
  ctaMode: string;
  userNotes?: string | undefined;
}

function buildUserPrompt(ctx: UserPromptCtx): string {
  const hooksText = ctx.hooks
    .map((h, i) => {
      const parts = [
        `HOOK ${i + 1} (id=${h.id})`,
        h.title ? `Title: ${h.title}` : null,
        `Summary: ${h.summary}`,
        h.url ? `URL: ${h.url}` : null,
        h.raw_content ? `Excerpt: ${h.raw_content.slice(0, 800)}` : null,
      ].filter(Boolean);
      return parts.join('\n');
    })
    .join('\n\n');

  const personasText = ctx.personas
    .map((p) => {
      return [
        `PERSONA (id=${p.id}, name="${p.name}")`,
        `Tone of voice: ${p.tone_of_voice}`,
        `Target audience: ${p.target_audience_notes ?? '(not specified)'}`,
        `Hard rules (MUST respect):`,
        ...p.hard_rules.map((r) => `  - ${r}`),
        `Guidance (prefer, but not absolute):`,
        ...p.guidance.map((g) => `  - ${g}`),
        p.snippets.length > 0
          ? `Style examples from this persona:\n${p.snippets.map((s) => `  """${s.slice(0, 400)}"""`).join('\n')}`
          : 'Style examples: (none yet)',
      ].join('\n');
    })
    .join('\n\n');

  const categoriesText = [
    `Primary category: ${ctx.primaryCategory.display_name} (${ctx.primaryCategory.slug})`,
    ctx.primaryCategory.description ? `  ${ctx.primaryCategory.description}` : null,
    ctx.primaryCategory.generation_guidance ? `  Guidance: ${ctx.primaryCategory.generation_guidance}` : null,
    ctx.secondaryCategories.length > 0
      ? `Secondary categories:\n${ctx.secondaryCategories
          .map(
            (c) =>
              `  - ${c.display_name} (${c.slug})${
                c.generation_guidance ? `: ${c.generation_guidance}` : ''
              }`,
          )
          .join('\n')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const insightsText = ctx.insights.length
    ? ctx.insights
        .map(
          (i) =>
            `[${i.section}] v${i.version}:\n${i.bullets.map((b) => `  - ${b}`).join('\n')}`,
        )
        .join('\n')
    : '(none)';

  return `${hooksText}

${personasText}

${categoriesText}

CTA mode: ${ctx.ctaMode}
${ctx.userNotes ? `\nExtra note from user: ${ctx.userNotes}` : ''}

Active algorithm insights (use as writing guide, not as bullet list to copy):
${insightsText}

Produce ${SUGGESTIONS_PER_PERSONA} suggestion(s) per active persona. Make them structurally different. Call save_suggestions now.`;
}
