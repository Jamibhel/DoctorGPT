"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useSession } from "@/lib/auth/session-context";
import { db } from "@/lib/firebase/config";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewsletterStatus("submitting");

    try {
      await addDoc(collection(db, "newsletter_subscribers"), {
        email: newsletterEmail.trim().toLowerCase(),
        consentedAt: serverTimestamp(),
        source: "website",
      });
      setNewsletterEmail("");
      setNewsletterStatus("success");
    } catch (error) {
      console.error("Failed to save newsletter subscription:", error);
      setNewsletterStatus("error");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/workspace");
    }
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-12">
        <header className="sticky top-4 z-20 rounded-[28px] border border-slate-200/80 bg-white/80 px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" aria-label="BJI MediSupport home" className="flex items-center gap-3">
              <Image src="/icons/bji-medisupport-192.png" alt="" aria-hidden="true" width={56} height={56} priority className="h-12 w-12 shrink-0 rounded-2xl object-contain shadow-sm" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-emerald-700">Healthcare platform</div>
                <div className="text-base font-bold text-slate-900">BJI MediSupport</div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Log in</Link>
              <Link href="/signup" className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,118,110,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_18px_32px_rgba(15,118,110,0.34)]">Create workspace</Link>
            </div>
          </div>
          <nav aria-label="Main navigation" className="mt-4 flex gap-6 overflow-x-auto border-t border-slate-100 pt-3 text-sm font-medium text-slate-600">
            <a href="#platform" className="shrink-0 transition hover:text-emerald-800">Platform</a>
            <a href="#solutions" className="shrink-0 transition hover:text-emerald-800">Solutions</a>
            <a href="#about" className="shrink-0 transition hover:text-emerald-800">About</a>
            <a href="#contact" className="shrink-0 transition hover:text-emerald-800">Contact</a>
          </nav>
        </header>

        <section id="platform" className="grid items-center gap-10 pb-14 pt-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800 shadow-sm">
              Connected care operations
            </div>
            <h1 className="max-w-xl text-4xl font-black tracking-[-0.06em] text-slate-900 sm:text-5xl lg:text-6xl">BJI MediSupport</h1>
            <p className="mt-5 max-w-xl text-xl font-medium text-slate-700">Healthcare operations built around the people, facilities, and patient journeys that matter most.</p>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Bring staff access, patient intake, facility operations, and care workflows into one elegantly organized workspace designed to support secure, efficient decisions.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/signup" className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(15,118,110,0.26)] transition hover:-translate-y-0.5">Create your workspace</Link>
              <Link href="/login" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Open existing workspace</Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white/90 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="rounded-[24px] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-5 text-white shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Workspace preview</div>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">Clinical command center</h2>
                </div>
                <div className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100">Live</div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  ["Admissions", "18 active"],
                  ["Patients", "24 under review"],
                  ["Beds", "12 available"],
                  ["Urgent care", "3 flagged"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
                    <span className="text-sm text-slate-200">{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">System status</p>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Operations secure</div>
                  <div className="text-xs text-slate-500">Verified organization onboarding</div>
                </div>
                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.8)]" />
              </div>
            </div>
          </div>
        </section>

        <section id="solutions" className="grid gap-6 border-t border-slate-200 py-16 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Patient access</div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Care journey visibility</h2>
            <p className="mt-3 text-slate-600">Organize registration, appointments, intake, and care progression with a calm, clear workflow.</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Facility operations</div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Operational clarity</h2>
            <p className="mt-3 text-slate-600">Support staffing, facility configuration, bed flow, and queue management without visual clutter.</p>
          </div>
          <div id="security" className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Security</div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Protected entry</h2>
            <p className="mt-3 text-slate-600">Unauthenticated visitors remain on the public site until they have a valid organization, account, and facility context.</p>
          </div>
        </section>

        <section id="about" className="grid gap-6 border-t border-slate-200 py-14 md:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">About BJI MediSupport</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">A refined platform for modern care operations.</h2>
          </div>
          <div className="max-w-3xl text-base leading-7 text-slate-600">
            <p>BJI MediSupport is a healthcare operations platform that helps organizations manage staff access, patient coordination, and facility workflows within one secure workspace.</p>
            <p className="mt-4">The experience is designed to feel intuitive and premium, while still supporting a realistic multi-tenant onboarding process and role-based access.</p>
          </div>
        </section>

        <section id="contact" className="border-t border-slate-200 py-14">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Contact</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Reach us online.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">BJI MediSupport is designed for digital-first healthcare operations. Connect with us by email or phone, or create a workspace to get started.</p>
              <div className="mt-5 flex flex-col items-start gap-2 text-sm font-semibold">
                <a href="mailto:bjimedisupport@gmail.com" className="text-emerald-800 transition hover:text-emerald-950">bjimedisupport@gmail.com</a>
                <a href="tel:+2349050955981" className="text-emerald-800 transition hover:text-emerald-950">+234 905 095 5981</a>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(15,118,110,0.26)]">Organization setup</Link>
              <Link href="/login" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Existing workspace</Link>
            </div>
          </div>
        </section>

        <section id="newsletter" className="border-y border-slate-200 py-10">
          <div className="grid gap-6 md:grid-cols-2 md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Newsletter</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Product updates and news</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">Subscribe to receive occasional BJI MediSupport updates. You can request removal at any time.</p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3 rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
              <label htmlFor="newsletter-email" className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="newsletter-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600"
                />
                <button type="submit" disabled={newsletterStatus === "submitting"} className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,118,110,0.24)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
                  {newsletterStatus === "submitting" ? "Subscribing..." : "Subscribe"}
                </button>
              </div>
              <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                <input type="checkbox" required className="mt-1 accent-emerald-700" />
                <span>I agree to receive occasional product updates by email.</span>
              </label>
              <p aria-live="polite" className={`text-sm ${newsletterStatus === "error" ? "text-red-700" : "text-emerald-800"}`}>
                {newsletterStatus === "success" && "You are subscribed to BJI MediSupport updates."}
                {newsletterStatus === "error" && "We could not save your subscription. Please try again or contact bjimedisupport@gmail.com."}
              </p>
            </form>
          </div>
        </section>

        <footer className="flex flex-col gap-4 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-slate-700">BJI MediSupport</span>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="#about" className="transition hover:text-slate-900">About</a>
            <a href="#contact" className="transition hover:text-slate-900">Contact</a>
            <a href="#newsletter" className="transition hover:text-slate-900">Newsletter</a>
            <Link href="/login" className="transition hover:text-slate-900">Log in</Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
