import Link from "next/link";
import { facilities, patients, staffMembers } from "@/lib/platform/mock-platform";

export default function FacilityDetailPage({
  params,
}: {
  params: { facilityId: string };
}) {
  const facility = facilities.find((item) => item.id === params.facilityId) ?? facilities[0];
  const facilityPatients = patients.filter((patient) => patient.facilityId === facility.id);
  const facilityStaff = staffMembers.filter((staff) => staff.facilityId === facility.id);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Facility details
            </p>
            <h1 className="mt-2 text-4xl font-bold">{facility.name}</h1>
          </div>
          <Link
            href="/facilities"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Back to facilities
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Facility type</div>
            <div className="mt-2 text-xl font-bold">{facility.facilityType}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Location</div>
            <div className="mt-2 text-xl font-bold">{facility.city}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Beds</div>
            <div className="mt-2 text-xl font-bold">{facility.beds}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Staff assigned</h2>
            <div className="mt-4 space-y-3">
              {facilityStaff.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <div className="font-semibold text-slate-900">{member.name}</div>
                    <div className="text-sm text-slate-500">{member.role} · {member.department}</div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Current patient volume</h2>
            <div className="mt-4 space-y-3">
              {facilityPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <div className="font-semibold text-slate-900">{patient.name}</div>
                    <div className="text-sm text-slate-500">{patient.mrn}</div>
                  </div>
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    {patient.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
