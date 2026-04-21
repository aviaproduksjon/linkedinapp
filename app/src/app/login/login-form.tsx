'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setMessage(null);

    const supabase = createClient();
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
      <label htmlFor="email" className="text-sm font-medium">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded border border-slate-300 px-3 py-2"
        placeholder="deniz@example.no"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send magic link'}
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
