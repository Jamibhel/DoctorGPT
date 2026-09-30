"use client";

import React, { useState } from "react";
import { 
  X, 
  BedDouble, 
  ArrowRightLeft, 
  LogOut, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle,
  Building2
} from "lucide-react";
import { useHospital } from "@/lib/state/hospital-store";

interface AdtModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'ADMISSION' | 'TRANSFER' | 'DISCHARGE';
}

export const AdtModal: React.FC<AdtModalProps> = ({ isOpen, onClose, initialMode = 'TRANSFER' }) => {
  const { 
    patients, 
    departments, 
    beds, 
    activePatient, 
    activeEncounter, 
    admitPatient, 
    transferPatient, 
    dischargePatient 
  } = useHospital();

  const [mode, setMode] = useState<'ADMISSION' | 'TRANSFER' | 'DISCHARGE'>(initialMode);
  
  // Admission Form State
  const [admitPatientId, setAdmitPatientId] = useState(activePatient.id);
  const [admitDeptId, setAdmitDeptId] = useState("dept-medsurg");
  const [admitBedId, setAdmitBedId] = useState("bed-301a");
  const [admitDiagnosis, setAdmitDiagnosis] = useState("Hyperglycemic Crisis with sensory neuropathy");
  const [chiefComplaint, setChiefComplaint] = useState("Severe lower extremity pain and elevated glucose");
  const [triageLevel, setTriageLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [codeStatus, setCodeStatus] = useState<'FULL_CODE' | 'DNR' | 'DNI'>('FULL_CODE');

  // Transfer Form State
  const [transferDeptId, setTransferDeptId] = useState("dept-icu");
  const [transferBedId, setTransferBedId] = useState("bed-icu1");
  const [transferReason, setTransferReason] = useState("Clinical escalation: Acute hypercapnic respiratory decline");

  // Discharge Form State
  const [dischargeSummary, setDischargeSummary] = useState(
    "Patient stabilized on basal insulin regimen and oral neuropathic analgesia. Outpatient podiatry and endocrine follow-up confirmed in 14 days."
  );

  if (!isOpen) return null;

  const availableBeds = beds.filter(b => b.status === 'AVAILABLE');

  const handleAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    admitPatient({
      patientId: admitPatientId,
      departmentId: admitDeptId,
      bedId: admitBedId,
      admittingDiagnosis: admitDiagnosis,
      chiefComplaint,
      triageLevel,
      codeStatus
    });
    onClose();
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    transferPatient({
      encounterId: activeEncounter.id,
      toDepartmentId: transferDeptId,
      toBedId: transferBedId,
      reason: transferReason
    });
    onClose();
  };

  const handleDischarge = (e: React.FormEvent) => {
    e.preventDefault();
    dischargePatient({
      encounterId: activeEncounter.id,
      dischargeSummaryText: dischargeSummary
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              ADT Hub: Admission, Discharge &amp; Transfer
            </h2>
            <p className="text-xs text-slate-500">
              Hospital bed state machine and ward movements
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1 m-4 rounded text-xs font-bold">
          <button
            onClick={() => setMode('TRANSFER')}
            className={`flex-1 py-1.5 rounded transition flex items-center justify-center gap-1.5 ${
              mode === 'TRANSFER' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Ward Transfer</span>
          </button>
          <button
            onClick={() => setMode('ADMISSION')}
            className={`flex-1 py-1.5 rounded transition flex items-center justify-center gap-1.5 ${
              mode === 'ADMISSION' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>New Admission</span>
          </button>
          <button
            onClick={() => setMode('DISCHARGE')}
            className={`flex-1 py-1.5 rounded transition flex items-center justify-center gap-1.5 ${
              mode === 'DISCHARGE' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Discharge</span>
          </button>
        </div>

        {/* Mode 1: TRANSFER */}
        {mode === 'TRANSFER' && (
          <form onSubmit={handleTransfer} className="p-4 space-y-3.5 overflow-y-auto text-xs">
            <div className="p-3 rounded bg-blue-50 border border-blue-100">
              <span className="font-bold text-blue-900">Current Patient &amp; Location:</span>
              <p className="text-blue-700 mt-0.5">
                {activePatient.lastName}, {activePatient.firstName} • Current Bed: <strong>{activeEncounter.activeBedId || 'Unassigned'}</strong>
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Destination Department / Ward
              </label>
              <select
                value={transferDeptId}
                onChange={(e) => setTransferDeptId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.totalBeds - d.occupiedBeds} beds available)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Target Available Bed
              </label>
              <select
                value={transferBedId}
                onChange={(e) => setTransferBedId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {availableBeds.map(b => (
                  <option key={b.id} value={b.id}>
                    Bed {b.bedNumber} ({b.wardId} - {b.isIcuEquipped ? 'ICU Capable' : 'Standard'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Clinical Reason for Transfer
              </label>
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Document clinical indication for transferring care..."
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
              >
                Confirm Transfer &amp; Release Bed
              </button>
            </div>
          </form>
        )}

        {/* Mode 2: ADMISSION */}
        {mode === 'ADMISSION' && (
          <form onSubmit={handleAdmission} className="p-4 space-y-3.5 overflow-y-auto text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Select Patient
              </label>
              <select
                value={admitPatientId}
                onChange={(e) => setAdmitPatientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.lastName}, {p.firstName} (MRN: {p.mrn})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Admit Ward
                </label>
                <select
                  value={admitDeptId}
                  onChange={(e) => setAdmitDeptId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-3 py-2 outline-none font-medium"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Assign Bed
                </label>
                <select
                  value={admitBedId}
                  onChange={(e) => setAdmitBedId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-3 py-2 outline-none font-medium"
                >
                  {availableBeds.map(b => (
                    <option key={b.id} value={b.id}>Bed {b.bedNumber}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Admitting Diagnosis
              </label>
              <input
                type="text"
                value={admitDiagnosis}
                onChange={(e) => setAdmitDiagnosis(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-3 py-2 outline-none font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ESI Triage Level
                </label>
                <select
                  value={triageLevel}
                  onChange={(e) => setTriageLevel(Number(e.target.value) as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-3 py-2 outline-none"
                >
                  <option value={1}>Level 1 - Resuscitation / STAT</option>
                  <option value={2}>Level 2 - Emergent</option>
                  <option value={3}>Level 3 - Urgent</option>
                  <option value={4}>Level 4 - Less Urgent</option>
                  <option value={5}>Level 5 - Non-Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Code Status
                </label>
                <select
                  value={codeStatus}
                  onChange={(e) => setCodeStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded px-3 py-2 outline-none"
                >
                  <option value="FULL_CODE">Full Code</option>
                  <option value="DNR">DNR (Do Not Resuscitate)</option>
                  <option value="DNI">DNI (Do Not Intubate)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
              >
                Complete Admission
              </button>
            </div>
          </form>
        )}

        {/* Mode 3: DISCHARGE */}
        {mode === 'DISCHARGE' && (
          <form onSubmit={handleDischarge} className="p-4 space-y-3.5 overflow-y-auto text-xs">
            <div className="p-3 rounded bg-purple-50 border border-purple-100">
              <span className="font-bold text-purple-900">Discharging Inpatient:</span>
              <p className="text-purple-700 mt-0.5">
                {activePatient.lastName}, {activePatient.firstName} from Bed {activeEncounter.activeBedId || 'N/A'}. Bed will automatically transition to <strong>CLEANING</strong> status.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Discharge Summary &amp; Transition Plan
              </label>
              <textarea
                value={dischargeSummary}
                onChange={(e) => setDischargeSummary(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs"
              >
                Sign Discharge &amp; Release Bed
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
