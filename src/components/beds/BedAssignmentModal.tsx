"use client";

import React, { useState } from "react";
import { HospitalBed, IsolationPrecautionType } from "@/types/hospital";
import { useHospital } from "@/lib/state/hospital-store";
import { BedDouble, X, UserPlus, CheckCircle2, ShieldCheck, Stethoscope } from "lucide-react";

interface BedAssignmentModalProps {
  bed: HospitalBed;
  isOpen: boolean;
  onClose: () => void;
}

export const BedAssignmentModal: React.FC<BedAssignmentModalProps> = ({
  bed,
  isOpen,
  onClose
}) => {
  const { patients, encounters, assignBed, updateBedStatus, currentStaff } = useHospital();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || "");
  const [isolation, setIsolation] = useState<IsolationPrecautionType>("NONE");

  if (!isOpen) return null;

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const activeEnc = encounters.find(e => e.patientId === selectedPatientId && e.status === 'ACTIVE') || encounters[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const encId = activeEnc?.id || `Encounter/enc-${Date.now()}`;
    assignBed(bed.id, encId, selectedPatient.id);

    if (isolation !== 'NONE') {
      updateBedStatus(bed.id, { isolationPrecaution: isolation });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-bji shadow-2xl border border-[#D7DEE7] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BedDouble className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">Direct Bed Admission &amp; Assignment</h2>
              <p className="text-[11px] text-slate-300">Room {bed.roomNumber} - Bed {bed.bedNumber} ({bed.wardId})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900">
            <span className="font-bold">Bed Available for Immediate Intake</span>
            <div className="text-[10px] text-emerald-800 mt-0.5">
              Features: {bed.isIcuEquipped ? 'ICU Capable • ' : ''}{bed.telemetryEnabled ? 'Telemetry • ' : ''}
              {bed.isNegativePressure ? 'Negative Pressure' : 'Standard Inpatient'}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">Select Patient to Admit</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 bg-white text-xs font-semibold text-slate-800"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.lastName}, {p.firstName} (MRN: {p.mrn} • {p.dateOfBirth})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">Infection Control Isolation Precautions</label>
            <select
              value={isolation}
              onChange={(e) => setIsolation(e.target.value as IsolationPrecautionType)}
              className="w-full border border-slate-300 rounded p-2 bg-white text-xs font-semibold text-slate-800"
            >
              <option value="NONE">Standard Precautions (No Isolation)</option>
              <option value="CONTACT">Contact Isolation (MRSA / C. diff / VRE / ESBL)</option>
              <option value="DROPLET">Droplet Isolation (Influenza / Pertussis / Meningococcus)</option>
              <option value="AIRBORNE">Airborne Isolation (Tuberculosis / Measles / COVID - Neg Pressure)</option>
              <option value="NEUTROPENIC">Neutropenic / Protective Reverse Isolation</option>
            </select>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
            <span>Attending Clinician: <strong>{currentStaff.name}</strong> ({currentStaff.role})</span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D7DEE7]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-[#D7DEE7] hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-bji"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-bji shadow-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Admit to Bed</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
