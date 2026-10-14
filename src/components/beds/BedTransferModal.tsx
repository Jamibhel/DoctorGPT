"use client";

import React, { useState, useMemo } from "react";
import { HospitalBed, Patient, Encounter } from "@/types/hospital";
import { useHospital } from "@/lib/state/hospital-store";
import { 
  ArrowRightLeft, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  BedDouble, 
  ShieldAlert, 
  HeartPulse, 
  Activity 
} from "lucide-react";

interface BedTransferModalProps {
  fromBed: HospitalBed;
  patient: Patient;
  encounter: Encounter;
  isOpen: boolean;
  onClose: () => void;
}

export const BedTransferModal: React.FC<BedTransferModalProps> = ({
  fromBed,
  patient,
  encounter,
  isOpen,
  onClose
}) => {
  const { departments, beds, transferPatient, observations } = useHospital();

  const [selectedWardId, setSelectedWardId] = useState<string>(fromBed.wardId);
  const [selectedBedId, setSelectedBedId] = useState<string>("");
  const [reason, setReason] = useState<string>("ROUTINE_TRANSFER");
  const [clinicalNotes, setClinicalNotes] = useState<string>("");

  if (!isOpen) return null;

  // Latest patient observation for clinical acuity evaluation
  const patientObservations = observations.filter(o => o.patientId === patient.id);
  const latestObs = patientObservations[patientObservations.length - 1];
  const news2Score = latestObs?.news2Score ?? 0;
  const isHighAcuity = news2Score >= 7 || latestObs?.news2RiskTier === 'HIGH';

  // Available beds in target ward
  const availableBeds = beds.filter(b => b.wardId === selectedWardId && b.status === 'AVAILABLE' && b.id !== fromBed.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedId) return;

    transferPatient({
      encounterId: encounter.id,
      toDepartmentId: selectedWardId,
      toBedId: selectedBedId,
      reason: `${reason}${clinicalNotes ? `: ${clinicalNotes}` : ''}`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-bji shadow-2xl border border-[#D7DEE7] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Inpatient Bed &amp; Ward Transfer Order
              </h2>
              <p className="text-[11px] text-slate-300 font-mono">
                {patient.lastName}, {patient.firstName} (MRN: {patient.mrn}) • Currently Bed {fromBed.bedNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Acuity Guidance Alert */}
          {isHighAcuity && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-bji flex items-start gap-2.5 text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">CRITICAL ACUITY ALERT: NEWS2 SCORE {news2Score}</span>
                <p className="text-[11px] text-red-800 mt-0.5">
                  Patient exhibits high physiological deterioration risk. Intensive Care Unit (ICU) or Step-Down Ward with continuous telemetry is strongly indicated.
                </p>
              </div>
            </div>
          )}

          {/* Current Location vs Destination Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-bji grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Current Bed</span>
              <div className="font-bold text-slate-900 mt-0.5">Room {fromBed.roomNumber} - Bed {fromBed.bedNumber}</div>
              <div className="text-[10px] text-slate-500">{fromBed.wardId}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Destination</span>
              <div className="font-bold text-blue-700 mt-0.5">
                {selectedBedId ? `Bed ${selectedBedId}` : 'Select Available Bed'}
              </div>
              <div className="text-[10px] text-slate-500">Target Ward</div>
            </div>
          </div>

          {/* Target Ward Selector */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">Target Receiving Department / Ward</label>
            <select
              value={selectedWardId}
              onChange={(e) => {
                setSelectedWardId(e.target.value);
                setSelectedBedId("");
              }}
              className="w-full border border-slate-300 rounded p-2 bg-white text-xs font-semibold text-slate-800"
            >
              {departments.filter(d => d.type !== 'PHARMACY' && d.type !== 'RADIOLOGY').map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} (Floor {d.floor} • {d.occupiedBeds}/{d.totalBeds} Beds Occupied)
                </option>
              ))}
            </select>
          </div>

          {/* Target Bed Selector */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">Available Destination Bed</label>
            {availableBeds.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 font-medium">
                No vacant beds available in this ward. Consider bed turnover or select another ward.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                {availableBeds.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBedId(b.id)}
                    className={`p-2 rounded border text-left transition ${
                      selectedBedId === b.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Room {b.roomNumber}-{b.bedNumber}</span>
                      {b.isIcuEquipped && (
                        <span className="text-[9px] px-1 rounded bg-purple-100 text-purple-800 font-bold">ICU</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {b.telemetryEnabled ? 'Telemetry' : 'Standard'}
                      {b.isNegativePressure ? ' • Neg-Pressure' : ''}
                      {b.isBariatric ? ' • Bariatric' : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reason for Transfer */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">Clinical Transfer Indication</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 bg-white text-xs font-semibold text-slate-800"
            >
              <option value="ROUTINE_TRANSFER">Routine Ward Transfer</option>
              <option value="ESCALATION_TO_ICU">Critical Deterioration (ICU Escalation)</option>
              <option value="STEP_DOWN">Step-Down Recovery (De-escalation)</option>
              <option value="ISOLATION_COHORTING">Infection Control Isolation Cohorting</option>
              <option value="TELEMETRY_MONITORING">Initiation of Continuous Cardiac Telemetry</option>
            </select>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Handover SBAR &amp; Transfer Narrative</label>
            <textarea
              rows={2}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Document receiving nurse verbal handover, transport oxygen requirement, IV infusion pumps in transit..."
              className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-mono text-slate-800"
            />
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
              disabled={!selectedBedId}
              className={`px-4 py-1.5 text-white font-bold text-xs rounded-bji shadow-xs flex items-center gap-1.5 ${
                selectedBedId ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Execute Bed Transfer</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
