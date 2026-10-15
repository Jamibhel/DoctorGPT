"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { type StaffMember } from "@/lib/platform/mock-platform";
import { usePlatform } from "@/lib/platform/platform-store";

export default function FacilitiesPage() {
  const {
    facilities,
    activeOrganizationId,
    activeFacilityId,
    activeFacility,
    staffMembers,
    setActiveFacilityId,
    createStaffMember,
  } = usePlatform();
  const [inviteForm, setInviteForm] = useState<{ name: string; email: string; role: StaffMember["role"]; department: string }>({
    name: "",
    email: "",
    role: "physician",
    department: "Cardiology",
  });
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const organizationFacilities = facilities.filter((facility) => facility.organizationId === activeOrganizationId);

  const handleInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeFacilityId || !inviteForm.name.trim() || !inviteForm.email.trim()) {
      setInviteMessage("Please select a facility and complete the staff invitation details.");
      return;
    }

    const created = createStaffMember({
      facilityId: activeFacilityId,
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim(),
      role: inviteForm.role,
      department: inviteForm.department,
      status: "invited",
    });

    setInviteMessage(`Invitation sent to ${created.name} at ${activeFacility?.name ?? "the selected facility"}.`);
    setInviteForm({ name: "", email: "", role: "physician", department: "Cardiology" });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Multi-site platform
            </p>
            <h1 className="mt-2 text-4xl font-bold">Facilities</h1>
          </div>
          <Link
            href="/onboarding"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Add new facility
          </Link>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Invite staff</h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {activeFacility?.name ?? "No facility selected"}
            </span>
          </div>

          {inviteMessage && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {inviteMessage}
            </div>
          )}

          <form onSubmit={handleInvite} className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                value={inviteForm.name}
                onChange={(event) => setInviteForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400"
                placeholder="Dr. Priya Shah"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Work email
              <input
                type="email"
                value={inviteForm.email}
                onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400"
                placeholder="priya.shah@facility.org"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Role
              <select
                value={inviteForm.role}
                onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value as StaffMember["role"] }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400"
              >
                <option value="physician">Physician</option>
                <option value="nurse">Nurse</option>
                <option value="facility_admin">Facility admin</option>
                <option value="front_desk">Front desk</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Department
              <input
                value={inviteForm.department}
                onChange={(event) => setInviteForm((current) => ({ ...current, department: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400"
                placeholder="Cardiology"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Send invitation
              </button>
            </div>
          </form>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {organizationFacilities.map((facility) => (
            <Link
              key={facility.id}
              href={`/facilities/${facility.id}`}
              onClick={() => setActiveFacilityId(facility.id)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {facility.facilityType.replace("_", " ")}
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    facility.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {facility.status}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-semibold">{facility.name}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {facility.city} · {facility.timezone}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-500">Beds</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{facility.beds}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-500">Invited staff</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {staffMembers.filter((member) => member.facilityId === facility.id).length}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
