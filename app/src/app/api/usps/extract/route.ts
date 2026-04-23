import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropic } from '@/lib/ai/anthropic';
import { logAiUsage } from '@/lib/ai/usage';
import { env } from '@/lib/env';
import {
  extractInternalLinks,
  extractReadableText,
  fetchPage,
  FetchError,
} from '@/lib/http/fetch-page';

const MAX_PAGES = 6;
const MAX_TEXT_CHARS = 8_000;

/**
 * POST /api/usps/extract
 *
 * Scrapes the Avia company URLs stored on the user's company row, feeds the
 * combined readable text to Sonnet with a 'propose_usps' tool, and inserts
 * the suggestions into `usps` with status='suggested'. The user then reviews
 * and promotes to 'active' via /api/usps/[id].
 *
 * Phase 2 MVP: only scrapes `scraped_urls` on the Company row (seeded with
 * aviaprod.no). Web search + public SoMe synthesis comes later (O6).
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, legal_name, scraped_urls, services, target_segments')
    .maybeSingle();
  if (!company) {
    return NextResponse.json({ error: 'no company profile found' }, { status: 404 });
  }

  const { data: painPoints } = await supabase.from('pain_points').select('id, name, description');

  // Fetch the configured root URLs + a handful of internal links discovered
  // from each root. Bail fast on any single-page failure so the extractor
  // keeps working even if one subpage is slow/unreachable.
  const seedUrls = Array.from(new Set(company.scraped_urls ?? [])).slice(0, 3);
  const fetched: { url: string; text: string }[] = [];
  const fetchErrors: string[] = [];

  for (const seed of seedUrls) {
    try {
      const root = await fetchPage(seed);
      fetched.push({ url: seed, text: extractReadableText(root.html) });

      // Grab up to 5 internal links from the root, prefer likely-useful paths.
      const internal = extractInternalLinks(root.html, seed)
        .filter((u) => /om|about|case|arbeid|tjeneste|service|model/i.test(u))
        .slice(0, MAX_PAGES - 1);

      for (const link of internal) {
        if (fetched.length >= MAX_PAGES) break;
        try {
          const page = await fetchPage(link);
          fetched.push({ url: link, text: extractReadableText(page.html) });
        } catch (err) {
          fetchErrors.push(`${link}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      fetchErrors.push(
        `${seed}: ${err instanceof FetchError ? err.message : err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (fetched.length === 0) {
    return NextResponse.json(
      { error: 'could not fetch any source page', details: fetchErrors },
      { status: 502 },
    );
  }

  // Combine + trim to stay within prompt budget.
  const combined = fetched
    .map((p) => `--- ${p.url} ---\n${p.text.slice(0, 2500)}`)
    .join('\n\n')
    .slice(0, MAX_TEXT_CHARS);

  const anthropic = getAnthropic();
  const model = env.CLAUDE_MODEL_SONNET;

  const systemPrompt = `You extract unique selling points (USPs) for a Norwegian marketing agency from its own web pages. USPs must be:
- Specific enough that a competitor couldn't credibly make the same claim.
- Grounded in text that appears on the pages (not invented).
- Useful as context when writing LinkedIn posts for Norwegian marketing managers.

You MUST call the propose_usps tool exactly once. Never reply in plain text.`;

  const userPrompt = `Company: ${company.name}${company.legal_name ? ` (${company.legal_name})` : ''}
Services we know of: ${(company.services ?? []).join(', ') || '(none)'}
Target segments: ${(company.target_segments ?? []).join(', ') || '(none)'}

Known pain points of our audience:
${(painPoints ?? []).map((p) => `- ${p.id} | ${p.name} | ${p.description}`).join('\n') || '(none)'}

Scraped page content (may be messy, just use the substance):
${combined}

Return 4–8 USP candidates. For each:
- name: short, 1–4 Norwegian words.
- description: 1–2 Norwegian sentences.
- proof: concrete evidence you found (quote, number, or reference to a page). If nothing concrete exists, leave empty.
- related_pain_point_ids: 0–2 ids from the known pain points list that this USP addresses.
- source_url: the exact URL where the strongest evidence came from.`;

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [
      {
        name: 'propose_usps',
        description: 'Save 4–8 proposed USPs.',
        input_schema: {
          type: 'object',
          required: ['usps'],
          properties: {
            usps: {
              type: 'array',
              minItems: 1,
              maxItems: 10,
              items: {
                type: 'object',
                required: ['name', 'description'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  proof: { type: 'string' },
                  related_pain_point_ids: {
                    type: 'array',
                    items: { type: 'string' },
                    maxItems: 3,
                  },
                  source_url: { type: 'string' },
                },
              },
            },
          },
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'propose_usps' },
  });

  await logAiUsage({
    userId: user.id,
    model,
    module: 'usp_extractor',
    input_tokens: msg.usage.input_tokens,
    output_tokens: msg.usage.output_tokens,
    ref_type: 'company',
    ref_id: company.id,
  });

  const toolUse = msg.content.find(
    (b): b is Extract<(typeof msg.content)[number], { type: 'tool_use' }> => b.type === 'tool_use',
  );
  if (!toolUse) {
    return NextResponse.json({ error: 'model did not call propose_usps' }, { status: 502 });
  }

  const input = toolUse.input as {
    usps?: Array<{
      name?: unknown;
      description?: unknown;
      proof?: unknown;
      related_pain_point_ids?: unknown;
      source_url?: unknown;
    }>;
  };

  const validPainIds = new Set((painPoints ?? []).map((p) => p.id));
  const asString = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

  const rows = (input.usps ?? [])
    .map((u) => ({
      user_id: user.id,
      company_id: company.id,
      name: asString(u.name).slice(0, 80),
      description: asString(u.description).slice(0, 500),
      proof: asString(u.proof).slice(0, 500) || null,
      related_pain_point_ids: asStringArray(u.related_pain_point_ids).filter((id) =>
        validPainIds.has(id),
      ),
      source_url: asString(u.source_url) || null,
      status: 'suggested' as const,
    }))
    .filter((row) => row.name.length > 0 && row.description.length > 0);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'model returned no usable USPs', raw: input },
      { status: 502 },
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from('usps')
    .insert(rows)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    usps: inserted,
    pages_fetched: fetched.map((p) => p.url),
    fetch_errors: fetchErrors,
  });
}

export const runtime = 'nodejs';
export const maxDuration = 60;
