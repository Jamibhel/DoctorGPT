"use client";

import React, { useState } from "react";
import { SurgicalCase, IntraoperativeRecord, AsaClassification, SurgicalCaseStatus } from "@/types/hospital";
import { useHospital } from "@/lib/state/hospital-store";
import { 
  X, 
  Activity, 
  Droplet, 
  AlertTriangle, 
  CheckCircle2, 
  Scissors, 
  Heart, 
  Save, 
  FileText 
} from "lucide-react";

interface IntraopRecordModalProps {
  surgicalCase: SurgicalCase;
  isOpen: boolean;
  onClose: () => void;
}

export const IntraopRecordModal: React.FC<IntraopRecordModalProps> = ({
  surgicalCase,
  isOpen,
  onClose
}) => {
  const { updateSurgicalCase } = useHospital();

  const [record, setRecord] = useState<IntraoperativeRecord>({
    ...surgicalCase.intraoperative
  });

  const [status, setStatus] = useState<SurgicalCaseStatus>(surgicalCase.status);
  const [pacuStatus, setPacuStatus] = useState<string>(surgicalCase.pacuStatus || "Pre-Op Prep");
  const [notes, setNotes] = useState<string>(surgicalCase.notes || "");

  if (!isOpen) return null;

  // Real-time Fluid Balance Calculations
  const totalFluidsIn = (record.crystalloidsMl || 0) + (record.colloidsMl || 0);
  const totalFluidsOut = (record.eblMl || 0) + (record.urineOutputMl || 0);
  const netFluidBalance = totalFluidsIn - totalFluidsOut;

  // Counts Verification Calculations
  const spongeExpected = (record.spongeCountInitial || 0) + (record.spongeCountAdded || 0);
  const spongeMismatch = record.spongeCountFinal !== spongeExpected;

  const needleExpected = (record.needleCountInitial || 0) + (record.needleCountAdded || 0);
  const needleMismatch = record.needleCountFinal !== needleExpected;

  const instrumentMismatch = record.instrumentCountInitial !== record.instrumentCountFinal;

  const hasCountDiscrepancy = spongeMismatch || needleMismatch || instrumentMismatch;

  const handleSave = () => {
    updateSurgicalCase(surgicalCase.id, {
      status,
      pacuStatus,
      notes,
      intraoperative: {
        ...record,
        countsReconciled: !hasCountDiscrepancy
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-bji shadow-2xl border border-[#D7DEE7] w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Intraoperative Record &amp; Surgical Count Reconciliation
              </h2>
              <p className="text-[11px] text-slate-300 font-mono">
                {surgicalCase.operatingRoom} • {surgicalCase.procedureName} • Patient: {surgicalCase.patientName} ({surgicalCase.mrn})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">

          {/* Section 1: Anesthesia & Surgical Team */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 pb-2 border-b border-[#E7ECF3]">
              <Heart className="w-4 h-4 text-rose-600" />
              <span>Anesthetic Management &amp; Surgical Team</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Anesthesia Modality</label>
                <select
                  value={record.anesthesiaType}
                  onChange={(e) => setRecord({ ...record, anesthesiaType: e.target.value as any })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono text-slate-800"
                >
                  <option value="GENERAL">General Endotracheal Anesthesia</option>
                  <option value="SPINAL_EPIDURAL">Neuraxial (Spinal / Epidural)</option>
                  <option value="REGIONAL_BLOCK">Peripheral Regional Nerve Block</option>
                  <option value="MAC_SEDATION">Monitored Anesthesia Care (MAC)</option>
                  <option value="LOCAL">Local Infiltration</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">ASA Physical Status</label>
                <select
                  value={record.asaScore}
                  onChange={(e) => setRecord({ ...record, asaScore: e.target.value as AsaClassification })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono font-bold text-slate-800"
                >
                  <option value="ASA_I">ASA I - Normal healthy patient</option>
                  <option value="ASA_II">ASA II - Mild systemic disease</option>
                  <option value="ASA_III">ASA III - Severe systemic disease</option>
                  <option value="ASA_IV">ASA IV - Life-threatening systemic disease</option>
                  <option value="ASA_V">ASA V - Moribund, not expected to survive</option>
                  <option value="ASA_VI">ASA VI - Brain dead organ donor</option>
                  <option value="ASA_IE">ASA I-E - Emergency Healthy</option>
                  <option value="ASA_IIE">ASA II-E - Emergency Mild Disease</option>
                  <option value="ASA_IIIE">ASA III-E - Emergency Severe Disease</option>
                  <option value="ASA_IVE">ASA IV-E - Emergency Life-threatening</option>
                  <option value="ASA_VE">ASA V-E - Emergency Moribund</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Anesthetic Gas / Agent</label>
                <input
                  type="text"
                  value={record.gasAgent}
                  onChange={(e) => setRecord({ ...record, gasAgent: e.target.value })}
                  placeholder="e.g. Sevoflurane 2.0% + Remifentanil"
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Primary Attending Surgeon</label>
                <input
                  type="text"
                  value={record.primarySurgeon}
                  onChange={(e) => setRecord({ ...record, primarySurgeon: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Attending Anesthesiologist</label>
                <input
                  type="text"
                  value={record.anesthesiologist}
                  onChange={(e) => setRecord({ ...record, anesthesiologist: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Perioperative Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SurgicalCaseStatus)}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono font-bold text-slate-800"
                >
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="PRE_OP">PRE_OP</option>
                  <option value="IN_ROOM">IN_ROOM</option>
                  <option value="TIME_OUT">TIME_OUT</option>
                  <option value="INTRA_OP">INTRA_OP (Underway)</option>
                  <option value="CLOSING">CLOSING (Wound Closure)</option>
                  <option value="PACU_RECOVERY">PACU_RECOVERY</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Hemodynamics, EBL & Fluid Balance */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E7ECF3]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-blue-600" />
                <span>Estimated Blood Loss (EBL) &amp; Fluid Balance</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500">
                  Fluids In: <strong>{totalFluidsIn} mL</strong> • Fluids Out: <strong>{totalFluidsOut} mL</strong>
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                  netFluidBalance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Net: {netFluidBalance > 0 ? `+${netFluidBalance}` : netFluidBalance} mL
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                <label className="block text-slate-600 font-medium mb-1">Estimated Blood Loss (EBL)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={record.eblMl}
                    onChange={(e) => setRecord({ ...record, eblMl: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded p-1 bg-white font-mono font-bold text-red-700"
                  />
                  <span className="text-slate-500 text-[11px]">mL</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                <label className="block text-slate-600 font-medium mb-1">Urine Output</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={record.urineOutputMl}
                    onChange={(e) => setRecord({ ...record, urineOutputMl: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded p-1 bg-white font-mono font-bold text-amber-700"
                  />
                  <span className="text-slate-500 text-[11px]">mL</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                <label className="block text-slate-600 font-medium mb-1">Crystalloids (LR / NS)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={record.crystalloidsMl}
                    onChange={(e) => setRecord({ ...record, crystalloidsMl: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded p-1 bg-white font-mono font-bold text-blue-700"
                  />
                  <span className="text-slate-500 text-[11px]">mL</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                <label className="block text-slate-600 font-medium mb-1">Colloids (Albumin)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={record.colloidsMl}
                    onChange={(e) => setRecord({ ...record, colloidsMl: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded p-1 bg-white font-mono font-bold text-blue-700"
                  />
                  <span className="text-slate-500 text-[11px]">mL</span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs text-slate-600 font-medium mb-1">Blood Products Transfused</label>
              <input
                type="text"
                value={record.bloodProductsTransfused}
                onChange={(e) => setRecord({ ...record, bloodProductsTransfused: e.target.value })}
                placeholder="e.g. 2 Units Packed Red Blood Cells (PRBCs) + 1 Unit Fresh Frozen Plasma (FFP)"
                className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white font-mono text-slate-800"
              />
            </div>
          </div>

          {/* Section 3: Surgical Count Reconciliation */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E7ECF3]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-emerald-600" />
                <span>Surgical Count Reconciliation Engine (Sponges, Needles, Instruments)</span>
              </h3>
              <div>
                {hasCountDiscrepancy ? (
                  <span className="px-2.5 py-1 bg-red-100 border border-red-300 text-red-800 font-bold font-mono text-[11px] rounded flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    COUNT DISCREPANCY DETECTED
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold font-mono text-[11px] rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ALL COUNTS RECONCILED CORRECT
                  </span>
                )}
              </div>
            </div>

            {hasCountDiscrepancy && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-bji text-xs text-red-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">MANDATORY PROTOCOL FOR UNRECONCILED COUNT:</strong>
                  <p className="mt-0.5 text-[11px] text-red-800">
                    Immediately notify operating surgeon. Perform systematic cavity &amp; wound recount. If count remains unreconciled before closure, an immediate intraoperative portable X-ray / fluoroscopy of the surgical field is mandatory per BJI Sentinel Safety Policy.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs">
              {/* Sponges */}
              <div className={`p-3 rounded-bji border ${spongeMismatch ? 'border-red-300 bg-red-50/40' : 'border-[#D7DEE7] bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900">Sponges &amp; Lap Pads</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    spongeMismatch ? 'bg-red-200 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {spongeMismatch ? 'MISMATCH' : 'BALANCED'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Initial:</span>
                    <input
                      type="number"
                      value={record.spongeCountInitial}
                      onChange={(e) => setRecord({ ...record, spongeCountInitial: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Added:</span>
                    <input
                      type="number"
                      value={record.spongeCountAdded}
                      onChange={(e) => setRecord({ ...record, spongeCountAdded: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Final (Retrieved):</span>
                    <input
                      type="number"
                      value={record.spongeCountFinal}
                      onChange={(e) => setRecord({ ...record, spongeCountFinal: parseInt(e.target.value) || 0 })}
                      className={`w-full border rounded p-1 font-mono text-center font-bold ${
                        spongeMismatch ? 'border-red-500 text-red-700 bg-red-50' : 'border-slate-300 bg-white text-emerald-700'
                      }`}
                    />
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-1.5 text-center">
                  Expected: {spongeExpected} | Actual: {record.spongeCountFinal}
                </div>
              </div>

              {/* Needles & Sharps */}
              <div className={`p-3 rounded-bji border ${needleMismatch ? 'border-red-300 bg-red-50/40' : 'border-[#D7DEE7] bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900">Needles &amp; Sharps</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    needleMismatch ? 'bg-red-200 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {needleMismatch ? 'MISMATCH' : 'BALANCED'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Initial:</span>
                    <input
                      type="number"
                      value={record.needleCountInitial}
                      onChange={(e) => setRecord({ ...record, needleCountInitial: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Added:</span>
                    <input
                      type="number"
                      value={record.needleCountAdded}
                      onChange={(e) => setRecord({ ...record, needleCountAdded: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Final (Retrieved):</span>
                    <input
                      type="number"
                      value={record.needleCountFinal}
                      onChange={(e) => setRecord({ ...record, needleCountFinal: parseInt(e.target.value) || 0 })}
                      className={`w-full border rounded p-1 font-mono text-center font-bold ${
                        needleMismatch ? 'border-red-500 text-red-700 bg-red-50' : 'border-slate-300 bg-white text-emerald-700'
                      }`}
                    />
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-1.5 text-center">
                  Expected: {needleExpected} | Actual: {record.needleCountFinal}
                </div>
              </div>

              {/* Surgical Instruments */}
              <div className={`p-3 rounded-bji border ${instrumentMismatch ? 'border-red-300 bg-red-50/40' : 'border-[#D7DEE7] bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900">Instruments / Trays</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    instrumentMismatch ? 'bg-red-200 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {instrumentMismatch ? 'MISMATCH' : 'BALANCED'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Baseline Tray Count:</span>
                    <input
                      type="number"
                      value={record.instrumentCountInitial}
                      onChange={(e) => setRecord({ ...record, instrumentCountInitial: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded p-1 bg-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Post-Op Final Count:</span>
                    <input
                      type="number"
                      value={record.instrumentCountFinal}
                      onChange={(e) => setRecord({ ...record, instrumentCountFinal: parseInt(e.target.value) || 0 })}
                      className={`w-full border rounded p-1 font-mono text-center font-bold ${
                        instrumentMismatch ? 'border-red-500 text-red-700 bg-red-50' : 'border-slate-300 bg-white text-emerald-700'
                      }`}
                    />
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-1.5 text-center">
                  Initial: {record.instrumentCountInitial} | Final: {record.instrumentCountFinal}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Post-Op Destination & Clinical Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Post-Operative Disposition Destination</label>
              <select
                value={record.postOpDestination}
                onChange={(e) => setRecord({ ...record, postOpDestination: e.target.value as any })}
                className="w-full border border-slate-300 rounded p-2 bg-white text-xs font-semibold text-slate-800"
              >
                <option value="PACU">Post-Anesthesia Care Unit (PACU / Recovery Room)</option>
                <option value="SURGICAL_ICU">Surgical Intensive Care Unit (SICU)</option>
                <option value="CARDIAC_ICU">Cardiovascular ICU (CVICU)</option>
                <option value="DAY_SURGERY">Ambulatory Day Surgery Discharge Lounge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">PACU Bedside Transfer Status</label>
              <input
                type="text"
                value={pacuStatus}
                onChange={(e) => setPacuStatus(e.target.value)}
                placeholder="e.g. Bed 4 Reserved • Extubated • SBAR Given"
                className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-mono text-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-900 mb-1">Operative Findings &amp; Perioperative Narrative</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Document operative specimen pathology, implants (serial/lot numbers), drains placed, or critical events..."
                className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-mono text-slate-800"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-[#D7DEE7] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              Changes will update live perioperative telemetry and emit clinical event audits.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-[#D7DEE7] hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-bji"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-bji shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Intraoperative Record</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
