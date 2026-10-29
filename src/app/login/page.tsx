"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSession } from "@/lib/auth/session-context";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loginStaff } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/workspace");
    }
  }, [isAuthenticated, router]);

  const onboardingComplete = searchParams.get("setup") === "complete";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const success = await loginStaff(email.trim(), password);
      if (!success) {
        setError("We could not sign you in. Check your email and password, and confirm your account is active and verified.");
        return;
      }

      router.push("/workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-900 sm:px-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8 text-white lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.28),transparent_28%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <Image src="/icons/bji-medisupport-192.png" alt="" aria-hidden="true" width={52} height={52} className="h-12 w-12 rounded-xl border border-white/10 bg-white/10 p-1.5" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">Healthcare platform</div>
                <div className="text-lg font-bold">BJI MediSupport</div>
              </div>
            </div>

            <h1 className="mt-8 max-w-md text-4xl font-black tracking-[-0.06em]">Secure access for a connected care team.</h1>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-200">Unify onboarding, facility visibility, patient journeys, and clinical workflows in one organization-first experience.</p>

            <div className="mt-8 space-y-3">
              {[
                "Organization-safe workspaces",
                "Verified staff onboarding",
                "Role-aware access to patient data",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 backdrop-blur-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-100">✓</div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Welcome back</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Sign in</h2>
              <p className="mt-2 text-sm text-slate-600">Use the email and password for your provisioned staff account.</p>
            </div>

            {onboardingComplete && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Organization setup complete. Sign in with your organization account to continue.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Email address
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 transition focus:border-emerald-600 focus:bg-white"
                  placeholder="you@company.org"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 transition focus:border-emerald-600 focus:bg-white"
                  placeholder="Your account password"
                />
              </label>

              <div className="-mt-1 text-right text-sm">
                <Link href="/forgot-password" className="font-semibold text-emerald-700 transition hover:text-emerald-800">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(15,118,110,0.26)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign in to workspace"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
              <span>Need an account?</span>
              <Link href="/signup" className="font-semibold text-emerald-700 transition hover:text-emerald-800">
                Sign up
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">
              Visitors remain on the public site until a valid account and facility are configured.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-slate-900"><div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-200/40"><p className="text-sm font-medium text-slate-600">Loading sign-in…</p></div></main>}>
      <LoginPageContent />
    </Suspense>
  );
}
