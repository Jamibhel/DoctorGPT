"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "@/lib/auth/session-context";
import { usePlatform } from "@/lib/platform/platform-store";
import { formatAppointmentTime } from "@/lib/platform/platform-operations";

export default function PatientsPage() {
  const { patients, activeFacilityId, activeFacility, registerPatient, scheduleAppointment } = usePlatform();
  const { hasPermission, currentUser, sessionType } = useSession();
  const canReadPatients = hasPermission("patients:read");
  const canCreatePatients = hasPermission("patients:create");
  const facilityPatients = patients.filter((patient) => patient.facilityId === activeFacilityId);
  const [patientForm, setPatientForm] = useState({ mrn: "", name: "", dob: "" });
  const [bookingForm, setBookingForm] = useState({
    patientId: "",
    clinician: "",
    time: "",
    type: "Follow-up visit",
  });
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  if (!canReadPatients) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Access restricted</p>
          <h1 className="mt-3 text-3xl font-bold">Patient record access denied</h1>
          <p className="mt-3 text-sm text-amber-800">
            {sessionType === "PATIENT"
              ? "Patient portal access is limited to the patient-facing view. Please use the portal for your own records."
              : `${currentUser.name} does not have permission to view patient records in ${activeFacility?.name ?? "this facility"}.`}
          </p>
        </div>
      </main>
    );
  }

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreatePatients) {
      setMessage({ tone: "error", text: "You do not have permission to register patients." });
      return;
    }
    if (!activeFacilityId) {
      setMessage({ tone: "error", text: "Select a facility before registering a patient." });
      return;
    }
    if (!patientForm.mrn || !patientForm.name || !patientForm.dob) {
      setMessage({ tone: "error", text: "Please complete MRN, patient name, and DOB." });
      return;
    }

    try {
      const created = await registerPatient({
        facilityId: activeFacilityId,
        mrn: patientForm.mrn.trim(),
        name: patientForm.name.trim(),
        dob: patientForm.dob,
      });
      setMessage({ tone: "success", text: `Registered ${created.name} at ${activeFacility?.name ?? "selected facility"}.` });
      setPatientForm({ mrn: "", name: "", dob: "" });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not save the patient to Firebase." });
    }
  };

  const handleSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreatePatients) {
      setMessage({ tone: "error", text: "You do not have permission to schedule appointments." });
      return;
    }
    if (!activeFacilityId) {
      setMessage({ tone: "error", text: "Select a facility before scheduling an appointment." });
      return;
    }
    const selectedPatient = facilityPatients.find((patient) => patient.id === bookingForm.patientId);
    if (!selectedPatient || !bookingForm.clinician || !bookingForm.time || !bookingForm.type) {
      setMessage({ tone: "error", text: "Please complete all appointment fields." });
      return;
    }

    try {
      const created = await scheduleAppointment({
        facilityId: activeFacilityId,
        patientId: selectedPatient.id,
        clinician: bookingForm.clinician,
        time: new Date(bookingForm.time).toISOString(),
        type: bookingForm.type,
      });
      setMessage({ tone: "success", text: `Booked ${created.type} for ${created.patientName} at ${formatAppointmentTime(created.time)}.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not save the appointment to Firebase." });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Patient operations
            </p>
            <h1 className="mt-2 text-4xl font-bold">Patient registry</h1>
          </div>
        </div>

        {message && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${message.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {message.text}
          </div>
        )}

        <div className="mb-8 grid gap-5 lg:grid-cols-2">
          {canCreatePatients && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Register patient</h2>
              <form onSubmit={handleRegister} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  MRN
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400"
                    value={patientForm.mrn}
                    onChange={(event) => setPatientForm((current) => ({ ...current, mrn: event.target.value }))}
                    placeholder="MRN-9001"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Date of birth
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400"
                    value={patientForm.dob}
                    onChange={(event) => setPatientForm((current) => ({ ...current, dob: event.target.value }))}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Full name
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400"
                  value={patientForm.name}
                  onChange={(event) => setPatientForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ava Patel"
                />
              </label>

              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                Facility: <span className="font-semibold text-slate-900">{activeFacility?.name ?? "No facility selected"}</span>
              </div>

                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Register patient
                </button>
              </form>
            </section>
          )}

          {canCreatePatients && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Schedule appointment</h2>
              <form onSubmit={handleSchedule} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Patient
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400"
                  value={bookingForm.patientId}
                  onChange={(event) => setBookingForm((current) => ({ ...current, patientId: event.target.value }))}
                  required
                  disabled={facilityPatients.length === 0}
                >
                  <option value="">{facilityPatients.length ? "Select a patient" : "Register a patient first"}</option>
                  {facilityPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.name} · {patient.mrn}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Clinician
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400"
                  value={bookingForm.clinician}
                  onChange={(event) => setBookingForm((current) => ({ ...current, clinician: event.target.value }))}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Date/time
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400"
                    value={bookingForm.time}
                    onChange={(event) => setBookingForm((current) => ({ ...current, time: event.target.value }))}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Visit type
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-400"
                    value={bookingForm.type}
                    onChange={(event) => setBookingForm((current) => ({ ...current, type: event.target.value }))}
                  />
                </label>
              </div>

                <button
                  type="submit"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Schedule appointment
                </button>
              </form>
            </section>
          )}
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">Registered patients</h2>
            <span className="font-mono text-xs text-slate-500">{facilityPatients.length}</span>
          </div>
          {facilityPatients.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-slate-800">No patient records yet</p>
              <p className="mt-1 text-sm text-slate-500">Patients registered at {activeFacility?.name ?? "this facility"} will appear here.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto sm:block">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">MRN</th>
                      <th className="px-4 py-3 font-semibold">Patient</th>
                      <th className="px-4 py-3 font-semibold">Date of birth</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {facilityPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-slate-700">{patient.mrn}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{patient.name}</td>
                        <td className="px-4 py-3 text-slate-600">{patient.dob}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-sm bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                            {patient.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-slate-200 sm:hidden">
                {facilityPatients.map((patient) => (
                  <li key={patient.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{patient.name}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">{patient.mrn} · DOB {patient.dob}</p>
                    </div>
                    <span className="shrink-0 rounded-sm bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-800">
                      {patient.status}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
