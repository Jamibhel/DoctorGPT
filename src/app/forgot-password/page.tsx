"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestFirebasePasswordReset } from "@/lib/firebase/tenant-service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      await requestFirebasePasswordReset(email);
      setMessage("If an account exists for this email, a password reset link has been sent.");
    } catch (resetError) {
      const code = (resetError as { code?: string }).code;
      if (code === "auth/user-not-found" || code === "auth/user-disabled") {
        setMessage("If an account exists for this email, a password reset link has been sent.");
      } else if (code === "auth/invalid-email") {
        setError("Enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many requests. Wait a few minutes, then try again.");
      } else {
        setError("We could not send a reset link right now. Check your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-slate-900">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/40">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Account recovery</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-sm text-slate-600">Enter your account email and we will send password reset instructions if an account matches.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Account email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500"
              placeholder="you@organization.org"
              required
            />
          </label>

          {message && <div role="status" aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>}
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm">
          <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
