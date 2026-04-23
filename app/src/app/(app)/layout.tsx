import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IdeaCapture } from '@/components/idea-capture';

/**
 * Authenticated app layout: sidebar + main content area.
 * Phase 2 MVP scope — refined in Phase 4.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-50 p-4 md:flex md:flex-col">
        <div className="mb-6">
          <div className="text-sm font-semibold text-slate-900">LinkedIn Hub</div>
          <div className="text-xs text-slate-500">{user.email}</div>
        </div>

        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/" className="rounded px-2 py-1.5 hover:bg-slate-200">
            Home
          </Link>
          <Link href="/ideas" className="rounded px-2 py-1.5 hover:bg-slate-200">
            Ide-bank
          </Link>
          <Link href="/company" className="rounded px-2 py-1.5 hover:bg-slate-200">
            Selskapsprofil
          </Link>
        </nav>

        <div className="mt-auto pt-4">
          <IdeaCapture />
        </div>

        <form action="/auth/signout" method="post" className="mt-4">
          <button
            type="submit"
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
          >
            Sign out
          </button>
        </form>
      </aside>

      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
