"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth/session-context";
import { usePlatform } from "@/lib/platform/platform-store";
import { formatAppointmentTime } from "@/lib/platform/platform-operations";
import { Activity, ArrowUpRight, BedDouble, Building2, CalendarDays, ClipboardPlus, Clock3, LogOut, Plus, Users } from "lucide-react";

export default function WorkspacePage() {
  const { isAuthenticated, currentUser, secureLogout, hasPermission } = useSession();
  const {
    organizations,
    facilities,
    staffMembers,
    patients,
    appointments,
    activeOrganizationId,
    activeFacilityId,
    setActiveOrganizationId,
    setActiveFacilityId,
    activeOrganization,
    activeFacility,
  } = usePlatform();

  const facilityPatients = patients.filter((patient) => patient.facilityId === activeFacilityId);
  const facilityStaff = staffMembers.filter((member) => member.facilityId === activeFacilityId);
  const facilityAppointments = appointments
    .filter((appointment) => appointment.facilityId === activeFacilityId && !["completed", "canceled"].includes(appointment.status))
    .sort((first, second) => {
      const firstTime = Date.parse(first.time);
      const secondTime = Date.parse(second.time);
      return (Number.isNaN(firstTime) ? Number.MAX_SAFE_INTEGER : firstTime)
        - (Number.isNaN(secondTime) ? Number.MAX_SAFE_INTEGER : secondTime);
    });
  const canReadPatients = hasPermission("patients:read");
  const canCreatePatients = hasPermission("patients:create");
  const canReadStaff = hasPermission("staff:read");

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-slate-900">
        <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/40">
          <Image src="/icons/bji-medisupport-192.png" alt="" aria-hidden="true" width={56} height={56} className="mx-auto mb-4 rounded-xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Access required</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Sign in to open your workspace</h1>
          <p className="mt-3 text-slate-600">The product workspace remains protected until a valid account and facility are available.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login" className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
              Log in
            </Link>
            <Link href="/signup" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Sign up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f4] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <Image src="/icons/bji-medisupport-192.png" alt="" aria-hidden="true" width={34} height={34} className="rounded-md" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">BJI MediSupport</p>
              <p className="text-xs text-slate-500">{currentUser.name} · {currentUser.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/facilities" className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <Building2 className="h-4 w-4" /> Facilities
            </Link>
            <button
              type="button"
              onClick={secureLogout}
              aria-label="Sign out"
              title="Sign out"
              className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-10">
        <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Operations overview</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{activeFacility?.name ?? "Your workspace"}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {activeOrganization?.name ?? "No organization selected"}{activeFacility ? ` · ${activeFacility.city}` : " · Set up a facility to begin"}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[460px]">
            <label className="text-xs font-semibold text-slate-600">
              Organization
              <select
                value={activeOrganizationId}
                onChange={(event) => setActiveOrganizationId(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              >
                {organizations.length > 0 ? organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>{organization.name}</option>
                )) : <option value="">No organizations</option>}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Facility
              <select
                value={activeFacilityId}
                onChange={(event) => setActiveFacilityId(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              >
                {facilities.filter((facility) => facility.organizationId === activeOrganizationId).length > 0
                  ? facilities.filter((facility) => facility.organizationId === activeOrganizationId).map((facility) => (
                    <option key={facility.id} value={facility.id}>{facility.name}</option>
                  ))
                  : <option value="">No facilities</option>}
              </select>
            </label>
          </div>
        </div>

        {!activeFacility ? (
          <section className="mt-8 border-l-4 border-emerald-700 bg-white px-6 py-7 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">Setup required</p>
            <h2 className="mt-2 text-xl font-bold">Create your first facility</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Once an organization and facility are configured, this page will show its patient, appointment, and team activity.
            </p>
            <Link href="/onboarding" className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900">
              <Plus className="h-4 w-4" /> Add facility
            </Link>
          </section>
        ) : (
          <>
            <section aria-label="Facility metrics" className="mt-6 grid grid-cols-2 divide-x divide-y divide-slate-200 border border-slate-200 bg-white sm:grid-cols-4 sm:divide-y-0">
              <Metric icon={<Users className="h-4 w-4" />} label="Patient records" value={canReadPatients ? facilityPatients.length : "Restricted"} />
              <Metric icon={<CalendarDays className="h-4 w-4" />} label="Open appointments" value={canReadPatients ? facilityAppointments.length : "Restricted"} />
              <Metric icon={<Activity className="h-4 w-4" />} label="Staff members" value={canReadStaff ? facilityStaff.length : "Restricted"} />
              <Metric icon={<BedDouble className="h-4 w-4" />} label="Configured beds" value={activeFacility.beds} />
            </section>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
              <section>
                <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-lg font-bold">Open appointments</h2>
                    <p className="mt-1 text-sm text-slate-500">Active schedule for {activeFacility.name}</p>
                  </div>
                  <Link href="/patients" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-950">
                    Patient operations <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                {!canReadPatients ? (
                  <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="Appointment details restricted" detail="Your role does not have permission to view patient-linked appointments." />
                ) : facilityAppointments.length ? (
                  <div className="divide-y divide-slate-200">
                    {facilityAppointments.slice(0, 6).map((appointment) => (
                      <div key={appointment.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{appointment.patientName}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{appointment.type} · {appointment.clinician}</p>
                        </div>
                        <div className="flex items-center gap-2 sm:justify-end">
                          <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700">{formatAppointmentTime(appointment.time)}</span>
                          <span className="rounded-sm bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-800">
                            {appointment.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="No upcoming appointments" detail="Appointments created for this facility will appear here." />
                )}
              </section>

              <aside className="space-y-8">
                <section>
                  <div className="flex items-end justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-lg font-bold">Patient records</h2>
                      <p className="mt-1 text-sm text-slate-500">Facility registry</p>
                    </div>
                    {canReadPatients && <Link href="/patients" aria-label="Open patient registry" title="Open patient registry" className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-white hover:text-emerald-800"><ArrowUpRight className="h-4 w-4" /></Link>}
                  </div>
                  {!canReadPatients ? (
                    <EmptyState icon={<Users className="h-5 w-5" />} title="Patient access restricted" detail="Your role does not have permission to view patient records." />
                  ) : facilityPatients.length ? (
                    <div className="divide-y divide-slate-200">
                      {facilityPatients.slice(0, 5).map((patient) => (
                        <div key={patient.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{patient.name}</p>
                            <p className="mt-0.5 font-mono text-[11px] text-slate-500">{patient.mrn}</p>
                          </div>
                          <span className="shrink-0 text-[10px] font-semibold uppercase text-slate-500">{patient.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={<Users className="h-5 w-5" />} title="No patient records yet" detail="Register a patient to start building this facility's registry." />
                  )}
                </section>

                <section>
                  <div className="border-b border-slate-200 pb-3">
                    <h2 className="text-lg font-bold">Quick actions</h2>
                    <p className="mt-1 text-sm text-slate-500">Common facility workflows</p>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {canCreatePatients && <ActionLink href="/patients" icon={<ClipboardPlus className="h-4 w-4" />} label="Register or schedule a patient" />}
                    <ActionLink href="/facilities" icon={<Users className="h-4 w-4" />} label="Manage facility and staff" />
                    <ActionLink href="/onboarding" icon={<Plus className="h-4 w-4" />} label="Add another facility" />
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex min-h-24 items-center gap-3 p-4 sm:p-5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-800">{icon}</span>
      <div>
        <p className="text-xl font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-1.5 text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 py-5 text-slate-500">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="mt-1 text-xs leading-5">{detail}</p>
      </div>
    </div>
  );
}

function ActionLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 py-3 text-sm font-semibold text-slate-700 transition hover:text-emerald-800">
      <span className="flex items-center gap-2.5"><span className="text-emerald-800">{icon}</span>{label}</span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
    </Link>
  );
}
