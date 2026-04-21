import { LoginForm } from './login-form';

export default function LoginPage() {
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
