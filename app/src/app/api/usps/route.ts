import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** GET /api/usps — list USPs for the current user, grouped by status. */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('usps')
    .select('*')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ usps: data ?? [] });
}
