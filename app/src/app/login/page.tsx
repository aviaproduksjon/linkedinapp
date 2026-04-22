import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';

/**
 * Login page.
 *
 * If Supabase happens to redirect the magic-link code here (e.g. Site URL
 * mismatch or redirect-whitelist gap), we still exchange it and forward to
 * the home page. This keeps us resilient to small Supabase config drift.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const code = typeof searchParams.code === 'string' ? searchParams.code : null;

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect('/');
    }
    // If exchange failed, fall through to the login form with an error hint.
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
        <h1 className="text-2xl font-semibold">Log in</h1>
        <p className="mt-2 text-sm text-red-600">
          Sign-in link invalid or expired ({error.message}). Send a new one below.
        </p>
        <LoginForm />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-2 text-sm text-slate-600">
        We&apos;ll send a one-time sign-in link to your email.
      </p>
      <LoginForm />
    </main>
  );
}
