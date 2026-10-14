"use client";

import React, { useState } from "react";
import { HospitalBed, EvsSanitizationChecklist } from "@/types/hospital";
import { useHospital } from "@/lib/state/hospital-store";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  Clock, 
  CheckSquare, 
  Square, 
  Wind, 
  Zap, 
  Activity 
} from "lucide-react";

interface EvsCleaningModalProps {
  bed: HospitalBed;
  isOpen: boolean;
  onClose: () => void;
}

export const EvsCleaningModal: React.FC<EvsCleaningModalProps> = ({
  bed,
  isOpen,
  onClose
}) => {
  const { completeEvsCleaning, currentStaff } = useHospital();

  const [cleaningType, setCleaningType] = useState<'STANDARD_TERMINAL' | 'ISOLATION_PATHOGEN_TERMINAL' | 'RAPID_TURNOVER'>(
    bed.isNegativePressure || bed.isolationPrecaution && bed.isolationPrecaution !== 'NONE'
      ? 'ISOLATION_PATHOGEN_TERMINAL'
      : 'STANDARD_TERMINAL'
  );

  const [checklist, setChecklist] = useState({
    linenStripped: true,
    highTouchDisinfected: true,
    uvcCycleCompleted: cleaningType === 'ISOLATION_PATHOGEN_TERMINAL',
    hepaAcheChecked: !!bed.isNegativePressure,
    telemetryTested: bed.telemetryEnabled || bed.isIcuEquipped,
    ppeRestocked: true
  });

  const [attendantName, setAttendantName] = useState<string>(currentStaff.name || "EVS Specialist Rosa Martinez");

  if (!isOpen) return null;

  const handleToggle = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allCompleted = 
    checklist.linenStripped && 
    checklist.highTouchDisinfected && 
    (cleaningType !== 'ISOLATION_PATHOGEN_TERMINAL' || checklist.uvcCycleCompleted) &&
    (!bed.isNegativePressure || checklist.hepaAcheChecked) &&
    checklist.ppeRestocked;

  const handleComplete = () => {
    const evsRecord: EvsSanitizationChecklist = {
      ...checklist,
      cleaningType,
      attendantName,
      turnoverMinutesRemaining: 0,
      completedAt: new Date().toISOString(),
      completedBy: attendantName
    };

    completeEvsCleaning(bed.id, evsRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-bji shadow-2xl border border-[#D7DEE7] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Environmental Services (EVS) Terminal Sanitization
              </h2>
              <p className="text-[11px] text-slate-300 font-mono">
                Room {bed.roomNumber} • Bed {bed.bedNumber} ({bed.wardId})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">

          {/* Bed Context Alert */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-bji flex items-center justify-between text-amber-900">
            <div>
              <span className="font-bold">Bed Turnover Status: CLEANING IN PROGRESS</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Bed is currently blocked from clinical admission until terminal sanitization attestation is certified.
              </p>
            </div>
            {bed.isNegativePressure && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Negative Pressure
              </span>
            )}
          </div>

          {/* Cleaning Protocol Selector */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">Disinfection Protocol Standard</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCleaningType('STANDARD_TERMINAL')}
                className={`p-2.5 rounded border text-left transition ${
                  cleaningType === 'STANDARD_TERMINAL'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">Standard Terminal</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">20 min routine post-discharge clean</div>
              </button>

              <button
                type="button"
                onClick={() => setCleaningType('ISOLATION_PATHOGEN_TERMINAL')}
                className={`p-2.5 rounded border text-left transition ${
                  cleaningType === 'ISOLATION_PATHOGEN_TERMINAL'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">Isolation Terminal</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">45 min bleach + UV-C emitter</div>
              </button>

              <button
                type="button"
                onClick={() => setCleaningType('RAPID_TURNOVER')}
                className={`p-2.5 rounded border text-left transition ${
                  cleaningType === 'RAPID_TURNOVER'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">Rapid Turnover</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">15 min emergency surge clean</div>
              </button>
            </div>
          </div>

          {/* 6-Point Checklist */}
          <div>
            <span className="block font-bold text-slate-900 mb-2">BJI Infection Control 6-Point Protocol Checklist</span>
            
            <div className="space-y-2">
              <label 
                onClick={() => handleToggle('linenStripped')}
                className={`p-2.5 rounded border cursor-pointer flex items-start gap-2.5 transition ${
                  checklist.linenStripped ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-slate-200'
                }`}
              >
                <div className="mt-0.5">
                  {checklist.linenStripped ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <span className="font-bold text-slate-900">Strip Linens &amp; Biohazard Disposal</span>
                  <p className="text-[10px] text-slate-500">All soiled bedsheets, pillows, and curtains stripped and sealed in alginate bags.</p>
                </div>
              </label>

              <label 
                onClick={() => handleToggle('highTouchDisinfected')}
                className={`p-2.5 rounded border cursor-pointer flex items-start gap-2.5 transition ${
                  checklist.highTouchDisinfected ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-slate-200'
                }`}
              >
                <div className="mt-0.5">
                  {checklist.highTouchDisinfected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <span className="font-bold text-slate-900">High-Touch Surface Disinfectant Wipe-Down</span>
                  <p className="text-[10px] text-slate-500">Bed rails, call bells, overbed tables, IV poles sanitized with EPA-registered sporicide (bleach/quat).</p>
                </div>
              </label>

              {cleaningType === 'ISOLATION_PATHOGEN_TERMINAL' && (
                <label 
                  onClick={() => handleToggle('uvcCycleCompleted')}
                  className={`p-2.5 rounded border cursor-pointer flex items-start gap-2.5 transition ${
                    checklist.uvcCycleCompleted ? 'bg-purple-50/70 border-purple-300' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="mt-0.5">
                    {checklist.uvcCycleCompleted ? <CheckSquare className="w-4 h-4 text-purple-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      <span>Ultraviolet-C (UV-C) Automated Optical Disinfection Run</span>
                    </span>
                    <p className="text-[10px] text-slate-500">360-degree autonomous UV-C robot emitter cycle completed (15-min burst, zero room entry).</p>
                  </div>
                </label>
              )}

              {bed.isNegativePressure && (
                <label 
                  onClick={() => handleToggle('hepaAcheChecked')}
                  className={`p-2.5 rounded border cursor-pointer flex items-start gap-2.5 transition ${
                    checklist.hepaAcheChecked ? 'bg-blue-50/70 border-blue-300' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="mt-0.5">
                    {checklist.hepaAcheChecked ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-blue-600" />
                      <span>HEPA Negative Pressure &amp; Airflow Gradient Check</span>
                    </span>
                    <p className="text-[10px] text-slate-500">Differential pressure gauge verified negative (&gt;2.5 Pa) and &ge;12 Air Changes per Hour (ACH).</p>
                  </div>
                </label>
              )}

              <label 
                onClick={() => handleToggle('telemetryTested')}
                className={`p-2.5 rounded border cursor-pointer flex items-start gap-2.5 transition ${
                  checklist.telemetryTested ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-slate-200'
                }`}
              >
                <div className="mt-0.5">
                  {checklist.telemetryTested ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Biomedical Telemetry &amp; Infusion Monitor Re-Dock</span>
                  </span>
                  <p className="text-[10px] text-slate-500">Bedside telemetry transmitter and IV infusion pumps docked, plugged into emergency power, and self-tested.</p>
                </div>
              </label>

              <label 
                onClick={() => handleToggle('ppeRestocked')}
                className={`p-2.5 rounded border cursor-pointer flex items-start gap-2.5 transition ${
                  checklist.ppeRestocked ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-slate-200'
                }`}
              >
                <div className="mt-0.5">
                  {checklist.ppeRestocked ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <span className="font-bold text-slate-900">Restock PPE Caddy &amp; Hand Hygiene Dispenser</span>
                  <p className="text-[10px] text-slate-500">Fresh nitrile gloves, N95/surgical masks, isolation gowns, and alcohol rub refilled.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Attendant Sign-Off */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-bji flex items-center justify-between">
            <span className="text-slate-600 font-medium">Certified EVS Attendant:</span>
            <input
              type="text"
              value={attendantName}
              onChange={(e) => setAttendantName(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded bg-white text-xs font-semibold text-slate-800"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-[#D7DEE7] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-[#D7DEE7] hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-bji"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!allCompleted}
            onClick={handleComplete}
            className={`px-4 py-1.5 text-white font-bold text-xs rounded-bji shadow-xs flex items-center gap-1.5 ${
              allCompleted
                ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                : 'bg-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Certify Clean &amp; Release Bed to Available</span>
          </button>
        </div>

      </div>
    </div>
  );
};
