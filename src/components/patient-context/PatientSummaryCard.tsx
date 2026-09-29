"use client";

import React, { useState } from "react";
import { 
  User, 
  Calendar, 
  AlertTriangle, 
  Pill, 
  HeartPulse, 
  FileText, 
  Search, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  Send,
  Loader2
} from "lucide-react";
import { Patient } from "@/types/clinical";
import { aiOrchestrator } from "@/lib/ai/orchestrator";

interface PatientSummaryCardProps {
  patient: Patient;
  onLogAudit: (action: string, details: string, category: 'QUERY') => void;
}

export const PatientSummaryCard: React.FC<PatientSummaryCardProps> = ({
  patient,
  onLogAudit,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'meds' | 'vitals' | 'history'>('overview');
  const [qaQuery, setQaQuery] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResult, setQaResult] = useState<{ answer: string; evidence: string[] } | null>(null);

  const handleAskRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuery.trim() || qaLoading) return;

    setQaLoading(true);
    try {
      const provider = aiOrchestrator.getProvider();
      const res = await provider.queryPatientRecord(patient, qaQuery.trim());
      setQaResult(res);
      onLogAudit(
        "Clinical Record Intelligence Query",
        `Clinician queried longitudinal chart: "${qaQuery.trim()}". AI grounded response generated.`,
        'QUERY'
      );
    } catch (err) {
      console.error(err);
    } finally {
      setQaLoading(false);
    }
  };

  const latestVital = patient.recentVitals[0];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Patient Header Identity */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {patient.lastName}, {patient.firstName}
              </h2>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                  MRN: {patient.mrn}
                </span>
                <span>•</span>
                <span>{patient.gender === 'F' ? 'Female' : 'Male'}, {patient.dob}</span>
                <span>•</span>
                <span className="font-medium text-slate-700">Blood: {patient.bloodType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Safety Allergies Banner */}
        {patient.allergies.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs">
            <div className="flex items-center gap-1 font-bold text-red-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Allergies:</span>
            </div>
            {patient.allergies.map((a, i) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-red-100/80 font-medium text-red-800 text-[11px]">
                {a.allergen} ({a.reaction})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 text-xs font-semibold px-4 pt-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-2.5 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Context & Due Items
        </button>
        <button
          onClick={() => setActiveTab('meds')}
          className={`py-2 px-2.5 border-b-2 transition ${
            activeTab === 'meds'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Medications ({patient.medications.length})
        </button>
        <button
          onClick={() => setActiveTab('vitals')}
          className={`py-2 px-2.5 border-b-2 transition ${
            activeTab === 'vitals'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Vitals Trend
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-2.5 border-b-2 transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Past Visits
        </button>
      </div>

      {/* Tab Panels Content */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Active Problems / Conditions */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-500" /> Active Problem List
              </div>
              <div className="flex flex-wrap gap-1.5">
                {patient.conditions.map((cond, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium text-xs border border-slate-200"
                  >
                    {cond}
                  </span>
                ))}
              </div>
            </div>

            {/* Outstanding Tasks / Care Gaps */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Overdue Investigations & Care Gaps
              </div>
              <div className="space-y-1.5">
                {patient.outstandingInvestigations.map((inv, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <span className="font-medium text-xs">{inv}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Vitals Snapshot */}
            {latestVital && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Most Recent Encounter Vitals ({latestVital.date})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">Blood Pressure</div>
                    <div className="font-bold text-slate-900 text-xs">{latestVital.bloodPressure}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">Heart Rate</div>
                    <div className="font-bold text-slate-900 text-xs">{latestVital.heartRate} bpm</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-[10px] text-slate-400">Oxygen Sat</div>
                    <div className="font-bold text-slate-900 text-xs">{latestVital.oxygenSaturation}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'meds' && (
          <div className="space-y-2">
            {patient.medications.map((m, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs">{m.name} {m.dosage}</div>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {m.indication}
                  </span>
                </div>
                <div className="text-slate-600 text-xs mt-1">Sig: {m.frequency}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Started: {m.startDate}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="space-y-2">
            {patient.recentVitals.map((v, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <div className="text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Encounter Date: {v.date}</span>
                  <span className="font-mono text-slate-600">BMI: {v.bmi}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[11px] text-slate-600">
                  <div>BP: <strong className="text-slate-900">{v.bloodPressure}</strong></div>
                  <div>HR: <strong className="text-slate-900">{v.heartRate} bpm</strong></div>
                  <div>Temp: <strong className="text-slate-900">{v.temperature.split(' ')[0]}</strong></div>
                  <div>SpO2: <strong className="text-slate-900">{v.oxygenSaturation}%</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {patient.pastEncounters.map((enc) => (
              <div key={enc.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900">{enc.type}</span>
                  <span className="text-slate-400 text-[11px]">{enc.date}</span>
                </div>
                <div className="text-[11px] text-blue-700 font-medium mb-1">Clinician: {enc.clinician}</div>
                <p className="text-slate-600 text-xs mb-1"><strong>Chief Complaint:</strong> {enc.chiefComplaint}</p>
                <p className="text-slate-600 text-xs mb-1"><strong>Diagnosis:</strong> {enc.diagnosis}</p>
                <div className="p-2 rounded bg-slate-50 text-[11px] text-slate-700 border border-slate-100 italic">
                  "{enc.notesSummary}"
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clinical Record Intelligence: Ask Record Q&A Panel */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Clinical Record Intelligence</span>
          </div>
          <span className="text-[10px] text-slate-400">Grounded Q&A</span>
        </div>

        {/* Quick query chips */}
        <div className="flex flex-wrap gap-1 mb-2">
          {["When was last HbA1c?", "List active medications", "Check allergy alerts"].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQaQuery(chip);
              }}
              className="text-[10px] bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 px-2 py-0.5 rounded border border-slate-200 transition"
            >
              {chip}
            </button>
          ))}
        </div>

        <form onSubmit={handleAskRecord} className="flex gap-1.5">
          <input
            type="text"
            value={qaQuery}
            onChange={(e) => setQaQuery(e.target.value)}
            placeholder={`Ask ${patient.firstName}'s record...`}
            className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            type="submit"
            disabled={qaLoading || !qaQuery.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-1.5 rounded-md transition flex items-center justify-center"
          >
            {qaLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>

        {/* Q&A Output Display */}
        {qaResult && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs">
            <p className="font-medium text-slate-900 leading-relaxed mb-2">{qaResult.answer}</p>
            {qaResult.evidence.length > 0 && (
              <div className="pt-2 border-t border-blue-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Source Grounding:</span>
                <ul className="mt-1 space-y-0.5">
                  {qaResult.evidence.map((ev, i) => (
                    <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                      <span className="text-blue-500">•</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
