import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** GET /api/hooks — list current user's hooks, newest + highest relevance first. */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('hooks')
    .select('*')
    .order('status', { ascending: true })
    .order('relevance_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ hooks: data ?? [] });
}
