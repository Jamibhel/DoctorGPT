"use client";

import { usePlatform } from "@/lib/platform/platform-store";

export default function PatientPortalPage() {
  const { appointments, patients, activeFacility } = usePlatform();
  const portalPatient = patients[0];
  const portalAppointments = appointments.filter(
    (appointment) => appointment.facilityId === activeFacility?.id && appointment.patientName === portalPatient?.name
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Patient portal
            </p>
            <h1 className="mt-2 text-4xl font-bold">Welcome, {portalPatient?.name ?? "Patient"}</h1>
          </div>
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            Log out
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl bg-emerald-600 p-5 text-white shadow-sm">
            <p className="text-sm text-emerald-100">Upcoming visits</p>
            <p className="mt-3 text-4xl font-bold">{portalAppointments.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Care summary</p>
            <p className="mt-3 text-2xl font-bold">Updated</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Message center</p>
            <p className="mt-3 text-2xl font-bold">1 alert</p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Your appointments</h2>
            <div className="mt-5 space-y-3">
              {portalAppointments.length > 0 ? (
                portalAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <div className="font-semibold text-slate-900">{appointment.type}</div>
                      <div className="mt-1 text-sm text-slate-600">{appointment.time}</div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {appointment.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No upcoming appointments for this facility.
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Quick profile</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div>
                <div className="text-slate-500">Name</div>
                <div className="font-medium text-slate-900">{portalPatient?.name}</div>
              </div>
              <div>
                <div className="text-slate-500">DOB</div>
                <div className="font-medium text-slate-900">{portalPatient?.dob}</div>
              </div>
              <div>
                <div className="text-slate-500">Preferred clinic</div>
                <div className="font-medium text-slate-900">{activeFacility?.name}</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
