"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePlatform } from "@/lib/platform/platform-store";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { completeFirebaseOrganizationSetup, refreshFirebaseEmailVerification, resendFirebaseVerificationEmail } from "@/lib/firebase/tenant-service";
import type { FacilityType } from "@/lib/platform/mock-platform";

const ONBOARDING_DRAFT_KEY = "bji_organization_onboarding_draft";

const steps = [
  "Organization profile",
  "Facility onboarding",
  "Staff invitations",
  "Patient registration",
  "Queue and appointment setup",
];

type OnboardingForm = {
  organizationName: string;
  adminEmail: string;
  billingAddress: string;
  facilityName: string;
  facilityType: FacilityType;
  city: string;
  timezone: string;
  adminName: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const { createOrganizationAndFacility, setActiveOrganizationId, setActiveFacilityId } = usePlatform();
  const [form, setForm] = useState({
    organizationName: "",
    adminEmail: "",
    billingAddress: "",
    facilityName: "",
    facilityType: "clinic" as const,
    city: "",
    timezone: "America/Chicago",
    adminName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(ONBOARDING_DRAFT_KEY);
      const draft = savedDraft ? JSON.parse(savedDraft) : {};
      const pendingOrganization = sessionStorage.getItem("bji_pending_organization_name");
      const pendingAdminName = sessionStorage.getItem("bji_pending_admin_name");
      if (savedDraft || pendingOrganization || pendingAdminName) {
        setForm((current) => ({
          ...current,
          ...(pendingOrganization ? { organizationName: pendingOrganization } : {}),
          ...(pendingAdminName ? { adminName: pendingAdminName } : {}),
          ...draft,
          ...(auth.currentUser?.email ? { adminEmail: auth.currentUser.email } : {}),
        }));
        setDraftStatus("Your saved draft has been restored.");
      }
    } catch {
      setDraftStatus("The saved draft could not be restored.");
    }
    return onAuthStateChanged(auth, (user) => {
      setAccountEmail(user?.email ?? "");
      setEmailVerified(user?.emailVerified ?? false);
      if (user?.email) {
        setForm((current) => ({ ...current, adminEmail: user.email ?? current.adminEmail }));
      }
    });
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value as OnboardingForm[typeof field] }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.adminEmail.trim()) {
      setError("Sign in with a verified administrator account before continuing.");
      return;
    }

    setIsSubmitting(true);
    try {
      const firebaseResult = await completeFirebaseOrganizationSetup({
        organizationName: form.organizationName,
        adminName: form.adminName || accountEmail,
        billingAddress: form.billingAddress,
        facilityName: form.facilityName,
        facilityType: form.facilityType,
        city: form.city,
        timezone: form.timezone,
      });
      const result = createOrganizationAndFacility({
        organizationName: firebaseResult.organizationName,
        adminEmail: firebaseResult.adminEmail,
        billingAddress: firebaseResult.billingAddress,
        facilityName: firebaseResult.facilityName,
        facilityType: firebaseResult.facilityType,
        city: firebaseResult.city,
        timezone: firebaseResult.timezone,
        adminName: firebaseResult.adminName,
        organizationId: firebaseResult.organizationId,
        facilityId: firebaseResult.facilityId,
      });

      setActiveOrganizationId(result.organization.id);
      setActiveFacilityId(result.facility.id);
      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      sessionStorage.removeItem("bji_pending_organization_name");
      setDraftStatus(firebaseResult.recovered
        ? "Your existing organization, facility, and administrator access were securely reconnected."
        : "Organization, facility, and administrator created securely.");
      router.push("/login?setup=complete");
    } catch (setupError) {
      const message = setupError instanceof Error ? setupError.message : "Organization setup failed. Please try again.";
      setError(message);
      if (message.includes("Verify your email")) {
        setDraftStatus("Check your email, follow the verification link, then return here and refresh this page.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setIsSendingVerification(true);
    try {
      await resendFirebaseVerificationEmail();
      setDraftStatus("Verification email sent. Check your inbox and spam folder.");
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : "Could not send the verification email.");
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      const verified = await refreshFirebaseEmailVerification();
      setEmailVerified(verified);
      setDraftStatus(verified ? "Email verified. You can complete organization setup." : "Email is not verified yet. Open the link in your inbox, then try again.");
    } catch {
      setError("Could not refresh email verification status. Reload the page and try again.");
    }
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(form));
      setDraftStatus("Draft saved in this browser.");
    } catch {
      setDraftStatus("Draft could not be saved in this browser.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Platform setup
            </p>
            <h1 className="mt-2 text-4xl font-bold">Organization onboarding</h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
          >
            Back to overview
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">New organization setup</h2>
            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Organization name
                <input
                  value={form.organizationName}
                  onChange={(event) => handleChange("organizationName", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-emerald-500 focus:bg-white"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Admin email
                <input
                  type="email"
                  value={form.adminEmail}
                  onChange={(event) => handleChange("adminEmail", event.target.value)}
                  readOnly={Boolean(accountEmail)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-emerald-500 focus:bg-white"
                />
                {accountEmail && (
                  <span className={`mt-1 block text-xs ${emailVerified ? "text-emerald-700" : "text-amber-700"}`}>
                    {emailVerified ? "Email verified" : "Email verification required"}
                  </span>
                )}
                {!accountEmail && (
                  <Link href="/signup" className="mt-1 inline-block text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                    Create the administrator account first
                  </Link>
                )}
              </label>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                Billing and contact information
                <textarea
                  value={form.billingAddress}
                  onChange={(event) => handleChange("billingAddress", event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Facility name
                <input
                  value={form.facilityName}
                  onChange={(event) => handleChange("facilityName", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-emerald-500 focus:bg-white"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Admin contact name
                <input
                  value={form.adminName}
                  onChange={(event) => handleChange("adminName", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-emerald-500 focus:bg-white"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Facility type
                <select
                  value={form.facilityType}
                  onChange={(event) => handleChange("facilityType", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                >
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="diagnostic_center">Diagnostic center</option>
                  <option value="specialist_center">Specialty center</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                City
                <input
                  value={form.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-emerald-500 focus:bg-white"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Timezone
                <select
                  value={form.timezone}
                  onChange={(event) => handleChange("timezone", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                >
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </label>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !accountEmail || !emailVerified}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                {isSubmitting ? "Creating secure workspace..." : "Create organization"}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Save draft
              </button>
            </div>
            {accountEmail && !emailVerified && (
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={handleResendVerification} disabled={isSendingVerification} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50">
                  {isSendingVerification ? "Sending..." : "Resend verification email"}
                </button>
                <button type="button" onClick={handleCheckVerification} className="text-sm font-semibold text-slate-700 hover:text-slate-900">
                  I verified my email
                </button>
              </div>
            )}
            {draftStatus && <p role="status" aria-live="polite" className="mt-3 text-sm text-slate-600">{draftStatus}</p>}
          </form>

          <aside className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-slate-100 shadow-sm">
            <h3 className="text-lg font-semibold">Setup checklist</h3>
            <ul className="mt-5 space-y-4">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-200">{step}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
