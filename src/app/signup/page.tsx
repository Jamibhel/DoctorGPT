"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";
import { beginFirebaseAdminSignup } from "@/lib/firebase/tenant-service";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordStrength = evaluatePasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!passwordStrength.isStrong) {
      setError("Meet every password requirement before continuing.");
      return;
    }
    if (!passwordsMatch) {
      setError("The passwords do not match.");
      return;
    }
    setIsSubmitting(true);

    try {
      await beginFirebaseAdminSignup({ name: fullName, email, password });
      sessionStorage.removeItem("bji_pending_organization_name");
      router.push("/onboarding");
    } catch (signupError) {
      const code = (signupError as { code?: string }).code;
      setError(signupError instanceof Error && !code
        ? signupError.message
        : code === "auth/email-already-in-use"
        ? "An account already exists for this email. Sign in instead."
        : code === "auth/weak-password"
          ? "Choose a stronger password that meets every requirement."
          : "Account creation failed. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-900 sm:px-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[1fr_1.1fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 p-8 text-white lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.35),transparent_28%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg font-black text-emerald-100 shadow-inner">B</div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">Secure setup</div>
                <div className="text-lg font-bold">BJI MediSupport</div>
              </div>
            </div>

            <h1 className="mt-8 max-w-md text-4xl font-black tracking-[-0.06em]">Create your secure care workspace.</h1>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-200">Set up your organization with a verified administrator account and move into a secure onboarding flow built for healthcare operations.</p>

            <div className="mt-8 space-y-3 text-sm text-slate-100">
              {[
                "Strong password enforcement",
                "Verified admin email onboarding",
                "Facility and organization recovery",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-100">✓</div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-xl">
            <div className="mb-8 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Create account</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Start secure onboarding</h2>
              <p className="mt-2 text-sm text-slate-600">Verify your work email to continue to secure organization setup.</p>
              <p className="mt-3 text-sm text-slate-600">Recovering an existing workspace? Use the current administrator email and the system can reconnect the saved organization and facility.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Full name
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 transition focus:border-emerald-600 focus:bg-white"
                  placeholder="Alex Morgan"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Work email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 transition focus:border-emerald-600 focus:bg-white"
                  placeholder="alex@organization.org"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Account password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 transition focus:border-emerald-600 focus:bg-white"
                  required
                />
              </label>

              <div aria-live="polite" className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">Password strength</span>
                  <span className={passwordStrength.isStrong ? "text-emerald-700" : "text-slate-500"}>{passwordStrength.label}</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-200"
                  role="progressbar"
                  aria-label="Password strength"
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-valuenow={passwordStrength.score}
                >
                  <div
                    className={`h-full transition-[width,background-color] ${passwordStrength.isStrong ? "bg-emerald-600" : passwordStrength.score >= 3 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${passwordStrength.score * 20}%` }}
                  />
                </div>
                <ul className="grid gap-x-3 gap-y-1 text-xs text-slate-600 sm:grid-cols-2">
                  {passwordStrength.requirements.map((requirement) => (
                    <li key={requirement.id} className={requirement.met ? "text-emerald-700" : "text-slate-500"}>
                      {requirement.met ? "Met" : "Required"}: {requirement.label}
                    </li>
                  ))}
                </ul>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 transition focus:border-emerald-600 focus:bg-white"
                  required
                />
                {confirmPassword.length > 0 && (
                  <span className={`mt-1 block text-xs ${passwordsMatch ? "text-emerald-700" : "text-red-700"}`}>
                    {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                  </span>
                )}
              </label>

              {error && (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !passwordStrength.isStrong || !passwordsMatch}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(15,118,110,0.26)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating secure account..." : "Continue to onboarding"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
              <span>Already have access?</span>
              <Link href="/login" className="font-semibold text-emerald-700 transition hover:text-emerald-800">
                Log in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
