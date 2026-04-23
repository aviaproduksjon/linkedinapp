import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_client) return _client;
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return _client;
}
