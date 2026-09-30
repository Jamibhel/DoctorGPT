"use client";

import React, { useState } from "react";
import { 
  X, 
  Pill, 
  TestTube2, 
  RotateCw, 
  Users, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Plus
} from "lucide-react";
import { CDSAlert, CPOEOrder, OrderPriority, OrderType } from "@/types/hospital";
import { useHospital } from "@/lib/state/hospital-store";

interface CpoeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CpoeOrderModal: React.FC<CpoeOrderModalProps> = ({ isOpen, onClose }) => {
  const { 
    activePatient, 
    activeEncounter, 
    evaluateCandidateOrder, 
    createCPOEOrder 
  } = useHospital();

  const [orderType, setOrderType] = useState<OrderType>('MEDICATION');
  const [priority, setPriority] = useState<OrderPriority>('ROUTINE');
  const [orderTitle, setOrderTitle] = useState("");
  const [dosage, setDosage] = useState("");
  const [route, setRoute] = useState<'ORAL' | 'IV' | 'SUBCUTANEOUS' | 'INHALATION'>('ORAL');
  const [frequency, setFrequency] = useState("Twice daily with meals");
  const [indication, setIndication] = useState("");
  const [orderDescription, setOrderDescription] = useState("");
  const [overrideRationale, setOverrideRationale] = useState("");
  const [activeCdsAlerts, setActiveCdsAlerts] = useState<CDSAlert[]>([]);

  if (!isOpen) return null;

  // Real-time CDS checking as doctor types medication/order
  const handleTitleChange = (val: string) => {
    setOrderTitle(val);
    if (val.trim().length > 3) {
      const alerts = evaluateCandidateOrder(val, orderType);
      setActiveCdsAlerts(alerts);
    } else {
      setActiveCdsAlerts([]);
    }
  };

  const handleQuickMedSelect = (name: string, dose: string, r: 'ORAL' | 'IV' | 'SUBCUTANEOUS', freq: string, ind: string) => {
    setOrderTitle(name);
    setDosage(dose);
    setRoute(r);
    setFrequency(freq);
    setIndication(ind);
    const alerts = evaluateCandidateOrder(name, 'MEDICATION');
    setActiveCdsAlerts(alerts);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    const hasHardContraindication = activeCdsAlerts.some(
      a => a.severity === 'CRITICAL_CONTRAINDICATION' && !a.canOverrideWithRationale
    );
    if (hasHardContraindication) {
      alert("Cannot place order: Critical contraindication detected. Please select an alternative therapy.");
      return;
    }

    if (activeCdsAlerts.length > 0 && !overrideRationale.trim()) {
      alert("Please provide a clinical override rationale to sign this order with active CDS alerts.");
      return;
    }

    createCPOEOrder({
      encounterId: activeEncounter.id,
      patientId: activePatient.id,
      orderType,
      priority,
      title: orderType === 'MEDICATION' ? `${orderTitle} ${dosage}` : orderTitle,
      description: orderDescription || `${orderTitle} ordered by attending physician for ${indication || 'clinical management'}`,
      medicationDetails: orderType === 'MEDICATION' ? {
        drugName: orderTitle,
        genericName: orderTitle,
        dosage,
        route,
        frequency,
        indication,
        scheduleTimes: ["08:00", "20:00"]
      } : undefined,
      cdsAlertsDismissed: activeCdsAlerts.map(a => ({
        alertId: a.id,
        clinicianRationale: overrideRationale,
        dismissedAt: new Date().toISOString(),
        dismissedBy: "Attending Physician"
      }))
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">Computerized Physician Order Entry (CPOE)</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Deterministic CDS Protected
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Patient: <strong className="text-slate-800">{activePatient.firstName} {activePatient.lastName}</strong> (MRN: {activePatient.mrn})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Order Type & Priority Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Order Type
              </label>
              <select
                value={orderType}
                onChange={(e) => {
                  setOrderType(e.target.value as OrderType);
                  setActiveCdsAlerts([]);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="MEDICATION">Medication / Prescription</option>
                <option value="LAB">Diagnostic Laboratory Test</option>
                <option value="RADIOLOGY">Radiology & Imaging</option>
                <option value="CONSULT">Specialist Inpatient Consult</option>
                <option value="NURSING">Nursing Procedure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as OrderPriority)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent (Within 2 hours)</option>
                <option value="STAT">STAT (Immediate Emergency)</option>
              </select>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          {orderType === 'MEDICATION' && (
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Common Clinical Presets (Click to Test CDS Safety Checks):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickMedSelect("Amoxicillin-Clavulanate", "875 mg", "ORAL", "BID", "Infection")}
                  className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-medium hover:bg-red-100 flex items-center gap-1"
                >
                  <ShieldAlert className="w-3 h-3 text-red-600" />
                  <span>Amoxicillin (Test Penicillin Allergy Alert)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickMedSelect("Ibuprofen", "600 mg", "ORAL", "TID PRN", "Pain")}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium hover:bg-amber-100 flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Ibuprofen (Test Warfarin DDI Alert)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickMedSelect("Insulin Lispro", "4 Units", "SUBCUTANEOUS", "TID AC", "Postprandial Glucose")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium hover:bg-emerald-100"
                >
                  <span>Insulin Lispro (Prandial)</span>
                </button>
              </div>
            </div>
          )}

          {/* Order Title / Drug Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {orderType === 'MEDICATION' ? 'Medication / Drug Name' : 'Test / Procedure / Consult Name'}
            </label>
            <input
              type="text"
              value={orderTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={orderType === 'MEDICATION' ? "e.g. Semaglutide, Ceftriaxone, Lisinopril" : "e.g. Echocardiogram, HbA1c, Wound Consult"}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Medication Specific Details */}
          {orderType === 'MEDICATION' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 0.25 mg, 500 mg"
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Route
                </label>
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="ORAL">Oral (PO)</option>
                  <option value="SUBCUTANEOUS">Subcutaneous (SubQ)</option>
                  <option value="IV">Intravenous (IV)</option>
                  <option value="INHALATION">Inhalation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Frequency
                </label>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. Once weekly, Daily qHS"
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* REAL-TIME DETERMINISTIC CDS ALERT BOX */}
          {activeCdsAlerts.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3">
              <div className="flex items-center space-x-2 text-red-700 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Clinical Decision Support Intercept ({activeCdsAlerts.length} Safety Alert{activeCdsAlerts.length > 1 ? 's' : ''})</span>
              </div>

              {activeCdsAlerts.map(alert => (
                <div key={alert.id} className="p-3 rounded-xl bg-white border border-red-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-700">{alert.type.replace('_', ' ')} INTERCEPT</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">{alert.conflictingItem}</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{alert.mechanism}</p>
                  <p className="text-emerald-700 font-semibold text-[11px] pt-1">
                    Recommendation: {alert.clinicalRecommendation}
                  </p>
                </div>
              ))}

              {/* Clinician Override Rationale */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-red-800 mb-1">
                  Mandatory Clinician Override Rationale:
                </label>
                <input
                  type="text"
                  value={overrideRationale}
                  onChange={(e) => setOverrideRationale(e.target.value)}
                  placeholder="State clinical indication or desensitization protocol justifying override..."
                  className="w-full bg-white border border-red-300 text-xs text-slate-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
            >
              <span>Sign &amp; Transmit Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
