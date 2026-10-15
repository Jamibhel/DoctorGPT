"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePlatform } from "@/lib/platform/platform-store";

const steps = [
  "Organization profile",
  "Facility onboarding",
  "Staff invitations",
  "Patient registration",
  "Queue and appointment setup",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { createOrganizationAndFacility, setActiveOrganizationId, setActiveFacilityId } = usePlatform();
  const [form, setForm] = useState({
    organizationName: "BJI Health Group",
    adminEmail: "admin@bjigroup.health",
    billingAddress: "1400 Innovation Drive, Austin, TX",
    facilityName: "BJI West Campus Clinic",
    facilityType: "clinic" as const,
    city: "Austin",
    timezone: "America/Chicago",
    adminName: "Elena Rostova",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.organizationName.trim() || !form.adminEmail.trim() || !form.facilityName.trim()) {
      setError("Organization name, admin email, and facility name are required.");
      return;
    }

    const result = createOrganizationAndFacility({
      organizationName: form.organizationName,
      adminEmail: form.adminEmail,
      billingAddress: form.billingAddress,
      facilityName: form.facilityName,
      facilityType: form.facilityType,
      city: form.city,
      timezone: form.timezone,
      adminName: form.adminName,
    });

    setActiveOrganizationId(result.organization.id);
    setActiveFacilityId(result.facility.id);
    setError(null);
    router.push("/");
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
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-emerald-500 focus:bg-white"
                />
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
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Save organization
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Save as draft
              </button>
            </div>
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
