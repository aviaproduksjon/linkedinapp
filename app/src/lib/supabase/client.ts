/**
 * Supabase browser client. Use from Client Components only.
 */

import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import type { Database } from '@shared/db-types';

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
