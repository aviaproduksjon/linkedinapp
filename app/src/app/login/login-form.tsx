'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';

type Mode = 'magic' | 'password';

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setMessage(null);

    const supabase = createClient();

    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }
      router.push('/');
      router.refresh();
      return;
    }

    // Magic link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }
    setStatus('sent');
    setMessage('Check your inbox for the sign-in link.');
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode('password')}
          className={`rounded px-3 py-1.5 ${
            mode === 'password'
              ? 'bg-slate-900 text-white'
              : 'border border-slate-300 text-slate-700'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setMode('magic')}
          className={`rounded px-3 py-1.5 ${
            mode === 'magic'
              ? 'bg-slate-900 text-white'
              : 'border border-slate-300 text-slate-700'
          }`}
        >
          Magic link
        </button>
      </div>

      <label htmlFor="email" className="text-sm font-medium">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded border border-slate-300 px-3 py-2"
        placeholder="deniz@example.no"
      />

      {mode === 'password' && (
        <>
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
          />
        </>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {status === 'sending'
          ? mode === 'password'
            ? 'Signing in…'
            : 'Sending…'
          : mode === 'password'
            ? 'Sign in'
            : 'Send magic link'}
      </button>

      {message && (
        <p
          className={
            status === 'error' ? 'text-sm text-red-600' : 'text-sm text-emerald-700'
          }
        >
          {message}
        </p>
      )}
    </form>
  );
}
