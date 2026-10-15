"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/lib/auth/session-context";
import { usePlatform } from "@/lib/platform/platform-store";

export default function HomePage() {
  const {
    organizations,
    appointments,
    patients,
    facilities,
    activeOrganizationId,
    activeFacilityId,
    setActiveOrganizationId,
    setActiveFacilityId,
    activeFacility,
    activeOrganization,
  } = usePlatform();
  const { currentUser, isAuthenticated, loginStaff, secureLogout } = useSession();
  const [loginEmail, setLoginEmail] = useState("a.thorne@bjihospital.org");
  const [loginPin, setLoginPin] = useState("1234");
  const [loginError, setLoginError] = useState<string | null>(null);

  const facilityAppointments = appointments.filter((appointment) => appointment.facilityId === activeFacilityId);
  const facilityPatients = patients.filter((patient) => patient.facilityId === activeFacilityId);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = loginStaff(loginEmail.trim(), loginPin.trim(), activeFacilityId || facilities[0]?.id || "");
    if (!success) {
      setLoginError("Invalid staff credentials or PIN for the selected facility.");
      return;
    }
    setLoginError(null);
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-900 px-6 py-10 text-white">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Secure access</p>
          <h1 className="mt-3 text-3xl font-bold">Clinical sign in</h1>
          <p className="mt-2 text-sm text-slate-300">Select a facility and sign in with staff credentials to continue.</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-200">
              Facility
              <select
                value={activeFacilityId}
                onChange={(event) => setActiveFacilityId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-white outline-none transition focus:border-emerald-400"
              >
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-200">
              Staff email
              <input
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-white outline-none transition focus:border-emerald-400"
                placeholder="a.thorne@bjihospital.org"
              />
            </label>

            <label className="block text-sm font-medium text-slate-200">
              PIN
              <input
                type="password"
                value={loginPin}
                onChange={(event) => setLoginPin(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-white outline-none transition focus:border-emerald-400"
                placeholder="1234"
              />
            </label>

            {loginError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {loginError}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Sign in to platform
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail("a.thorne@bjihospital.org");
                  setLoginPin("1234");
                  setActiveFacilityId(facilities[0]?.id ?? "");
                }}
                className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-600"
              >
                Use demo clinician
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              BJI MediSupport
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Connected healthcare platform</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={secureLogout}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Sign out
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Org</label>
              <select
                value={activeOrganizationId}
                onChange={(event) => setActiveOrganizationId(event.target.value)}
                className="bg-transparent text-sm font-medium text-slate-800 outline-none"
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Facility</label>
              <select
                value={activeFacilityId}
                onChange={(event) => setActiveFacilityId(event.target.value)}
                className="bg-transparent text-sm font-medium text-slate-800 outline-none"
              >
                {facilities
                  .filter((facility) => facility.organizationId === activeOrganizationId)
                  .map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
              </select>
            </div>
            <Link
              href="/onboarding"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Onboard a facility
            </Link>
            <Link
              href="/portal"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Patient portal
            </Link>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Active context</div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-white px-2.5 py-1 font-semibold">{activeOrganization?.name}</span>
            <span className="text-emerald-700">›</span>
            <span className="rounded-full bg-white px-2.5 py-1 font-semibold">{activeFacility?.name}</span>
          </div>
          <div className="mt-3 text-sm text-emerald-800">
            {isAuthenticated ? `${currentUser.name} · ${currentUser.facilityName}` : "No active staff session"}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Organizations</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{organizations.length}</div>
            <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">active and in-review</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Facilities</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{facilities.length}</div>
            <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">network wide</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Staff</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{facilities.filter((facility) => facility.organizationId === activeOrganizationId).length * 12}</div>
            <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">licensed and invited</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Patients</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{facilityPatients.length}</div>
            <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">within active facility</div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Organization overview</h2>
              <Link href="/facilities" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                View facilities
              </Link>
            </div>
            <div className="space-y-4">
              {organizations.map((organization) => (
                <button
                  key={organization.id}
                  type="button"
                  onClick={() => setActiveOrganizationId(organization.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    organization.id === activeOrganizationId
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-slate-900">{organization.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{organization.adminEmail}</div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      {organization.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg bg-white p-3">
                      <div className="text-slate-500">Facilities</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {facilities.filter((facility) => facility.organizationId === organization.id).length}
                      </div>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <div className="text-slate-500">Staff</div>
                      <div className="mt-1 font-semibold text-slate-900">{organization.staff}</div>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <div className="text-slate-500">Patients</div>
                      <div className="mt-1 font-semibold text-slate-900">{organization.patients}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Queue activity</h2>
              <Link href="/patients" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                Patient registry
              </Link>
            </div>
            <div className="space-y-3">
              {facilityAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-900">{appointment.patientName}</div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      {appointment.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {appointment.type} · {appointment.clinician}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">{appointment.time}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
