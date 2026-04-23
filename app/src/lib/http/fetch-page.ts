import 'server-only';

/**
 * Polite HTML fetcher used for scraping Avia's own pages for USP extraction.
 *
 * Rules (see docs/04-integrasjoner.md §5):
 *   - Respect robots.txt. For MVP we only scrape Avia's own domains so
 *     compliance is assumed, but we still set a recognisable user-agent.
 *   - Hard timeouts so a slow response never blocks the route handler.
 *   - Size cap so we can't be ambushed by a 100 MB page.
 */

const USER_AGENT = 'DenizLinkedInHubBot/0.1 (+https://linkedin.avialab.no)';

export interface FetchedPage {
  url: string;
  finalUrl: string;
  status: number;
  contentType: string;
  html: string;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

interface FetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
}

export async function fetchPage(url: string, opts: FetchOptions = {}): Promise<FetchedPage> {
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const maxBytes = opts.maxBytes ?? 2_000_000; // 2 MB is plenty for a page body.

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'nb,no;q=0.9,en;q=0.5',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new FetchError(`fetch ${url} returned ${res.status}`, res.status);
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('xml')) {
      throw new FetchError(`unexpected content-type: ${contentType}`, res.status);
    }

    // Stream-read up to maxBytes to avoid giant pages.
    if (!res.body) throw new FetchError('no response body');
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new FetchError(`response exceeded ${maxBytes} bytes`);
      }
      chunks.push(value);
    }
    const html = new TextDecoder('utf-8').decode(concatBytes(chunks));

    return {
      url,
      finalUrl: res.url,
      status: res.status,
      contentType,
      html,
    };
  } finally {
    clearTimeout(timer);
  }
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/**
 * Strip tags + collapse whitespace. Deliberately simple — we want clean text
 * for the LLM, not a structured DOM. Pulls content inside <main>, <article>,
 * or <body> if available.
 */
export function extractReadableText(html: string): string {
  // Remove scripts and styles completely.
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  // Prefer <main> or <article>; otherwise fall back to <body>.
  const main = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  const article = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1];
  const body = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  cleaned = main ?? article ?? body ?? cleaned;

  // Drop tags, decode a few common entities, collapse whitespace.
  const text = cleaned
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Extract on-domain links from a page, good for crawling "Om oss", "Case",
 * "Tjenester" subpages from the front page.
 */
export function extractInternalLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const hrefs = new Set<string>();
  const re = /<a[^>]+href\s*=\s*["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const href = match[1];
    if (!href) continue;
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname === base.hostname) {
        // Strip hash, keep search.
        resolved.hash = '';
        hrefs.add(resolved.toString());
      }
    } catch {
      // invalid href, skip
    }
  }
  return [...hrefs];
}
