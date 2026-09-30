"use client";

import React from "react";
import { 
  Activity, 
  Pill, 
  TestTube2, 
  FileText, 
  UserCheck, 
  ShieldAlert, 
  ArrowRightLeft, 
  LogOut, 
  AlertCircle,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useHospital } from "@/lib/state/hospital-store";
import { ClinicalEventType } from "@/types/hospital";

export const PatientTimelineView: React.FC = () => {
  const { events, activePatientId, activePatient } = useHospital();

  const patientEvents = events.filter(e => e.patientId === activePatientId);

  const getEventIcon = (type: ClinicalEventType) => {
    switch (type) {
      case 'PATIENT_ADMITTED': return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'PATIENT_TRANSFERRED': return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      case 'PATIENT_DISCHARGED': return <LogOut className="w-4 h-4 text-purple-600" />;
      case 'VITAL_RECORDED': return <Activity className="w-4 h-4 text-teal-600" />;
      case 'ALLERGY_RECORDED': return <ShieldAlert className="w-4 h-4 text-red-600" />;
      case 'MEDICATION_ORDERED': return <Pill className="w-4 h-4 text-blue-600" />;
      case 'PHARMACY_VERIFIED': return <CheckCircle2 className="w-4 h-4 text-purple-600" />;
      case 'MEDICATION_ADMINISTERED': return <Pill className="w-4 h-4 text-emerald-600" />;
      case 'LAB_RESULTED': return <TestTube2 className="w-4 h-4 text-amber-600" />;
      case 'NOTE_SIGNED': return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'EMERGENCY_CODE_TRIGGERED': return <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Unified Longitudinal Patient Timeline</span>
          </h3>
          <p className="text-xs text-slate-500">
            Chronological clinical event stream for <strong className="text-slate-800">{activePatient.firstName} {activePatient.lastName}</strong> ({patientEvents.length} events)
          </p>
        </div>
      </div>

      <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 my-2">
        {patientEvents.map((evt) => (
          <div key={evt.id} className="relative group">
            {/* Timeline Dot with Icon */}
            <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-xs group-hover:scale-110 transition">
              {getEventIcon(evt.type)}
            </div>

            <div className="bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-2xl border border-slate-200/70 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <span className="font-bold text-xs text-slate-900">{evt.title}</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {new Date(evt.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>

              <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-200/60">
                <span>By: {evt.authorName} ({evt.authorRole})</span>
                {evt.previousValue && evt.newValue && (
                  <span>• Delta: {evt.previousValue} &rarr; {evt.newValue}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
