import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Root route. Phase 1: only confirms auth is working. Sidebar, calendar, editor
 * and previews arrive in Phase 4 (UI).
 */
export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">Deniz LinkedIn Hub</h1>
      <p className="mt-2 text-slate-600">Phase 1 — grunnmur er satt opp.</p>
      <p className="mt-6 text-sm text-slate-500">Logged in as {user.email}.</p>
      <form action="/auth/signout" method="post" className="mt-6">
        <button
          type="submit"
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
