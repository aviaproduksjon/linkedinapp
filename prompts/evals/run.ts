/**
 * Canary eval runner.
 *
 * Phase 1 skeleton: walks /prompts/evals/canary/, parses each case, validates
 * structure. Does NOT call the real model yet — that's Phase 3 when generator
 * prompts are wired to Anthropic SDK.
 *
 * CI calls this via `pnpm evals`. Any failure fails the pipeline.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CANARY_DIR = join(__dirname, 'canary');

async function loadCanaryCases(): Promise<string[]> {
  const entries = await readdir(CANARY_DIR);
  return entries.filter((name) => name.endsWith('.yaml'));
}

async function validateCase(filename: string): Promise<boolean> {
  const raw = await readFile(join(CANARY_DIR, filename), 'utf-8');
  const hasPrompt = /^prompt:\s+\S+/m.test(raw);
  const hasAssertions = /^assertions:/m.test(raw);
  if (!hasPrompt || !hasAssertions) {
    console.error(
      `[evals] ${filename} missing required top-level keys (prompt, assertions)`,
    );
    return false;
  }
  console.log(`[evals] ${filename} structure OK`);
  return true;
}

async function main() {
  console.log('[evals] canary runner (Phase 1 skeleton — structure-only checks)');
  let cases: string[];
  try {
    cases = await loadCanaryCases();
  } catch (err) {
    console.error('[evals] could not read canary dir:', err);
    process.exit(1);
  }
  if (cases.length === 0) {
    console.error('[evals] no canary cases found');
    process.exit(1);
  }

  const results = await Promise.all(cases.map(validateCase));
  const failed = results.filter((ok) => !ok).length;
  if (failed > 0) {
    console.error(`[evals] ${failed} case(s) failed structural validation`);
    process.exit(1);
  }
  console.log(`[evals] ${cases.length} case(s) passed structural validation`);
}

main().catch((err) => {
  console.error('[evals] fatal:', err);
  process.exit(1);
});
