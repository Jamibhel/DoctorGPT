"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  UserCheck, 
  Pill, 
  Syringe, 
  X,
  FileCheck2,
  Info
} from "lucide-react";
import { MedicationAdministration, CPOEOrder, StaffMember } from "@/types/hospital";
import { useHospital } from "@/lib/state/hospital-store";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface DoseAdministrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  administration: MedicationAdministration | null;
  order: CPOEOrder | null;
}

export const DoseAdministrationModal: React.FC<DoseAdministrationModalProps> = ({
  isOpen,
  onClose,
  administration,
  order,
}) => {
  const { administerMedication, currentStaff, activePatient, staff } = useHospital();

  const [actionType, setActionType] = useState<'GIVEN' | 'HELD' | 'REFUSED'>('GIVEN');
  const [doseGiven, setDoseGiven] = useState(order?.medicationDetails?.dosage || "");
  const [routeGiven, setRouteGiven] = useState(order?.medicationDetails?.route || "ORAL");
  const [injectionSite, setInjectionSite] = useState("Right Upper Arm (Deltoid)");
  const [heldReason, setHeldReason] = useState("");
  const [cosignedBy, setCosignedBy] = useState("");

  // 5 Rights Verification Checklist
  const [rightPatientChecked, setRightPatientChecked] = useState(false);
  const [rightDrugChecked, setRightDrugChecked] = useState(false);
  const [rightDoseChecked, setRightDoseChecked] = useState(false);
  const [rightRouteChecked, setRightRouteChecked] = useState(false);
  const [rightTimeChecked, setRightTimeChecked] = useState(false);

  if (!isOpen || !administration || !order || !activePatient) return null;

  const isHighRisk = 
    order.title.toLowerCase().includes("insulin") || 
    order.title.toLowerCase().includes("heparin") ||
    order.title.toLowerCase().includes("morphine") ||
    order.title.toLowerCase().includes("oxycodone") ||
    order.title.toLowerCase().includes("fentanyl");

  const isFiveRightsComplete = 
    rightPatientChecked && 
    rightDrugChecked && 
    rightDoseChecked && 
    rightRouteChecked && 
    rightTimeChecked;

  const otherNurses = staff.filter(s => s.role === 'NURSE' && s.id !== currentStaff.id);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    if (actionType === 'GIVEN') {
      if (!isFiveRightsComplete) {
        alert("Patient Safety Intercept: All 5-Rights verifications must be confirmed before administering medication.");
        return;
      }
      if (isHighRisk && !cosignedBy) {
        alert("High-Risk Medication Protocol: A second nurse co-signature is mandatory for Insulin/Anticoagulant/Opioid administration.");
        return;
      }
    } else {
      if (!heldReason.trim()) {
        alert(`Mandatory Clinical Reason: Please provide clinical documentation explaining why medication was ${actionType}.`);
        return;
      }
    }

    administerMedication({
      administrationId: administration.id,
      status: actionType,
      doseGiven: actionType === 'GIVEN' ? doseGiven : undefined,
      routeGiven: actionType === 'GIVEN' ? routeGiven : undefined,
      injectionSite: actionType === 'GIVEN' && (routeGiven === 'SUBCUTANEOUS' || routeGiven === 'IV') ? injectionSite : undefined,
      heldReason: actionType !== 'GIVEN' ? heldReason : undefined,
      cosignedBy: actionType === 'GIVEN' && isHighRisk ? cosignedBy : undefined
    });

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="eMAR Bedside Medication Administration"
      subtitle={
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
          <span>Patient: <strong className="text-slate-800">{activePatient.lastName}, {activePatient.firstName}</strong></span>
          <span>•</span>
          <span className="font-mono">MRN: {activePatient.mrn}</span>
          <span>•</span>
          <Badge variant={isHighRisk ? "red" : "blue"} size="sm">
            {isHighRisk ? "HIGH-RISK DUAL SIGN" : "STANDARD MAR"}
          </Badge>
        </div>
      }
      maxWidth="lg"
    >
      <form onSubmit={handleConfirm} className="space-y-4">
        {/* Medication Summary Card */}
        <div className="p-3 bg-slate-50 border border-[#D7DEE7] rounded-bji flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-xs text-slate-900">{order.title}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Scheduled Dose: <strong className="text-slate-800">{order.medicationDetails?.dosage || 'Standard'}</strong> • Route: <strong className="text-slate-800">{order.medicationDetails?.route || 'ORAL'}</strong> • Freq: <strong className="text-slate-800">{order.medicationDetails?.frequency}</strong>
            </p>
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              Scheduled For: {new Date(administration.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Pharmacy: {order.status}
            </div>
          </div>

          <Badge variant={order.status === 'DISPENSED' ? 'emerald' : 'amber'} size="sm">
            {order.status}
          </Badge>
        </div>

        {/* Administration Action Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Administration Outcome
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActionType('GIVEN')}
              className={`py-2 px-3 rounded-bji border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                actionType === 'GIVEN'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-700 border-[#D7DEE7] hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>GIVEN (Administered)</span>
            </button>
            <button
              type="button"
              onClick={() => setActionType('HELD')}
              className={`py-2 px-3 rounded-bji border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                actionType === 'HELD'
                  ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-slate-700 border-[#D7DEE7] hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>HELD (Clinical Hold)</span>
            </button>
            <button
              type="button"
              onClick={() => setActionType('REFUSED')}
              className={`py-2 px-3 rounded-bji border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                actionType === 'REFUSED'
                  ? 'bg-red-700 text-white border-red-700 shadow-xs'
                  : 'bg-white text-slate-700 border-[#D7DEE7] hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>REFUSED (Patient Refusal)</span>
            </button>
          </div>
        </div>

        {/* GIVEN: 5-Rights Bedside Verification Checklist */}
        {actionType === 'GIVEN' && (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-bji space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Mandatory 5-Rights Bedside Safety Checklist</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const allChecked = isFiveRightsComplete;
                    setRightPatientChecked(!allChecked);
                    setRightDrugChecked(!allChecked);
                    setRightDoseChecked(!allChecked);
                    setRightRouteChecked(!allChecked);
                    setRightTimeChecked(!allChecked);
                  }}
                  className="text-[10px] font-bold text-blue-700 hover:text-blue-900 underline"
                >
                  {isFiveRightsComplete ? "Clear All" : "Verify All 5-Rights"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-1.5 bg-white rounded-bji border border-blue-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rightPatientChecked}
                    onChange={(e) => setRightPatientChecked(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span>1. Right Patient ({activePatient.lastName})</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-white rounded-bji border border-blue-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rightDrugChecked}
                    onChange={(e) => setRightDrugChecked(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span>2. Right Medication ({order.medicationDetails?.drugName})</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-white rounded-bji border border-blue-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rightDoseChecked}
                    onChange={(e) => setRightDoseChecked(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span>3. Right Dose ({order.medicationDetails?.dosage})</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-white rounded-bji border border-blue-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rightRouteChecked}
                    onChange={(e) => setRightRouteChecked(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span>4. Right Route ({order.medicationDetails?.route})</span>
                </label>

                <label className="flex items-center gap-2 p-1.5 bg-white rounded-bji border border-blue-100 cursor-pointer sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={rightTimeChecked}
                    onChange={(e) => setRightTimeChecked(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span>5. Right Time &amp; Documentation ({new Date(administration.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                </label>
              </div>
            </div>

            {/* Dose Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Actual Dose Given
                </label>
                <input
                  type="text"
                  value={doseGiven}
                  onChange={(e) => setDoseGiven(e.target.value)}
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Actual Route Administered
                </label>
                <input
                  type="text"
                  value={routeGiven}
                  onChange={(e) => setRouteGiven(e.target.value)}
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  required
                />
              </div>
            </div>

            {/* Injection Site if SubQ or IV */}
            {(routeGiven === 'SUBCUTANEOUS' || routeGiven === 'IV') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Anatomical Injection Site / IV Port
                </label>
                <select
                  value={injectionSite}
                  onChange={(e) => setInjectionSite(e.target.value)}
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                >
                  <option value="Right Upper Arm (Deltoid)">Right Upper Arm (Deltoid)</option>
                  <option value="Left Upper Arm (Deltoid)">Left Upper Arm (Deltoid)</option>
                  <option value="Abdomen - Right Lower Quadrant">Abdomen - Right Lower Quadrant</option>
                  <option value="Abdomen - Left Lower Quadrant">Abdomen - Left Lower Quadrant</option>
                  <option value="Right Thigh (Vastus Lateralis)">Right Thigh (Vastus Lateralis)</option>
                  <option value="Left Thigh (Vastus Lateralis)">Left Thigh (Vastus Lateralis)</option>
                  <option value="Peripheral IV - Right Forearm">Peripheral IV - Right Forearm</option>
                  <option value="Peripheral IV - Left Antecubital">Peripheral IV - Left Antecubital</option>
                  <option value="Central Venous Catheter (CVC)">Central Venous Catheter (CVC)</option>
                </select>
              </div>
            )}

            {/* High Alert Cosign */}
            {isHighRisk && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-bji space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Dual Independent Nurse Verification Required</span>
                </div>
                <p className="text-[11px] text-red-700 leading-tight">
                  High-alert medication ({order.medicationDetails?.drugName}). Second licensed practitioner must independently calculate dose and verify infusion settings.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1">
                    Verifying Cosigner (Second Nurse):
                  </label>
                  <select
                    value={cosignedBy}
                    onChange={(e) => setCosignedBy(e.target.value)}
                    className="w-full bg-white border border-red-300 text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-red-600 font-mono"
                    required
                  >
                    <option value="">-- Select Verifying Nurse --</option>
                    {otherNurses.map(n => (
                      <option key={n.id} value={n.name}>{n.name} ({n.licenseNumber || 'RN'})</option>
                    ))}
                    <option value="Nurse Vaughn, RN, BSN">Nurse Vaughn, RN, BSN</option>
                    <option value="Nurse Hayes, RN">Nurse Hayes, RN</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HELD or REFUSED: Mandatory Reason */}
        {actionType !== 'GIVEN' && (
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Mandatory Clinical Documentation / Reason for {actionType}:
            </label>
            <textarea
              value={heldReason}
              onChange={(e) => setHeldReason(e.target.value)}
              rows={3}
              placeholder={
                actionType === 'HELD' 
                  ? "e.g. SBP < 90 mmHg (hypotension hold parameter met), patient NPO for endoscopy, bleeding observed..."
                  : "e.g. Patient declined medication stating mild nausea; educated on consequences; attending physician notified."
              }
              className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji p-2.5 outline-none focus:ring-1 focus:ring-blue-600"
              required
            />
          </div>
        )}

        {/* Form Actions */}
        <div className="pt-3 border-t border-[#D7DEE7] flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Administered by: {currentStaff.name} ({currentStaff.role})
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className={actionType === 'GIVEN' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-700 hover:bg-amber-800'}
            >
              Confirm {actionType}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
