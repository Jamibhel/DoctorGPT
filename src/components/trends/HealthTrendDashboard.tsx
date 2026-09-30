"use client";

import React, { useState } from "react";
import { Patient } from "@/types/clinical";
import { 
  TrendingUp, 
  Activity, 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

interface HealthTrendDashboardProps {
  patient: Patient;
}

export const HealthTrendDashboard: React.FC<HealthTrendDashboardProps> = ({ patient }) => {
  const [selectedTimeline, setSelectedTimeline] = useState<'3M' | '6M' | '1Y'>('6M');

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Health Trends &amp; Analytics</h1>
          <p className="text-xs text-slate-500">
            Longitudinal Glycemic Trajectory, Medication Response, and Care Gap Audits for <strong className="text-slate-800">{patient.firstName} {patient.lastName}</strong>
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {(['3M', '6M', '1Y'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTimeline(t)}
              className={`px-3 py-1 rounded-lg transition ${
                selectedTimeline === t
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: HbA1c (Red Alert) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Latest HbA1c</span>
            <span className="text-red-600 font-bold flex items-center gap-0.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> +0.5%
            </span>
          </div>
          <div className="text-2xl font-bold text-red-600">8.4%</div>
          <div className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Suboptimal (Target: &lt; 7.0%)
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-red-500 h-full rounded-full" style={{ width: '84%' }} />
          </div>
        </div>

        {/* Metric 2: Blood Pressure (Red/Amber Alert) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Office BP</span>
            <span className="text-amber-600 font-bold flex items-center gap-0.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> +6 mmHg
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">148 / 92</div>
          <div className="text-xs text-amber-600 mt-1 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Stage 2 Hypertension
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '75%' }} />
          </div>
        </div>

        {/* Metric 3: Medication Adherence (Green Vital) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Med Adherence</span>
            <span className="text-emerald-600 font-bold flex items-center gap-0.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">92%</div>
          <div className="text-xs text-slate-500 mt-1">
            Metformin 1000mg BID
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
          </div>
        </div>

        {/* Metric 4: Preventive Care Gaps */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Care Gaps</span>
            <span className="text-red-600 font-bold text-xs">Action Required</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">2 Tests</div>
          <div className="text-xs text-slate-500 mt-1">
            Retinal Eye Exam &amp; UACR
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-red-500 h-full rounded-full" style={{ width: '60%' }} />
          </div>
        </div>
      </div>

      {/* Main Longitudinal Trend Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>6-Month Fasting Glucose &amp; Glycemic Trajectory</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Elevating fasting glucose despite dual oral hypoglycemic therapy.
              </p>
            </div>
          </div>

          {/* SVG Vector Plot */}
          <div className="relative pt-2">
            <div className="h-56 w-full flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-1 flex justify-between text-[11px] text-slate-400">
                <span>200 mg/dL (Severe Hyperglycemia)</span>
                <span>HbA1c ~ 8.5%</span>
              </div>
              <div className="border-b border-red-200 border-dashed pb-1 flex justify-between text-[11px] text-red-500 font-medium">
                <span>175 mg/dL (Current Baseline)</span>
                <span>Uncontrolled</span>
              </div>
              <div className="border-b border-emerald-200 border-dashed pb-1 flex justify-between text-[11px] text-emerald-600 font-medium">
                <span>130 mg/dL (Target Goal)</span>
                <span>Optimal</span>
              </div>
              <div className="border-b border-slate-100 pb-1 flex justify-between text-[11px] text-slate-400">
                <span>100 mg/dL (Normal Range)</span>
                <span>HbA1c &lt; 5.7%</span>
              </div>
            </div>

            <svg className="absolute inset-0 w-full h-56 pt-2" preserveAspectRatio="none" viewBox="0 0 500 200">
              <defs>
                <linearGradient id="glucoseGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 20,130 Q 150,110 260,90 T 480,50 L 480,180 L 20,180 Z"
                fill="url(#glucoseGradLight)"
              />
              <path
                d="M 20,130 Q 150,110 260,90 T 480,50"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="20" cy="130" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              <circle cx="150" cy="115" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              <circle cx="260" cy="90" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              <circle cx="370" cy="72" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
              <circle cx="480" cy="50" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            </svg>

            <div className="flex justify-between text-xs text-slate-400 mt-3 px-1">
              <span>April 2026</span>
              <span>June 2026 (Metformin 1000mg)</span>
              <span>August 2026</span>
              <span className="text-blue-700 font-bold">Today (188 mg/dL)</span>
            </div>
          </div>

          {/* AI Clinical Insight */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-slate-900">Clinical Recommendation: Escalate to GLP-1 Receptor Agonist</div>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Despite verified adherence to dual oral agents, fasting glucose continues upward. Recommend initiating subcutaneous Semaglutide (0.25mg titration) or basal insulin glargine.
              </p>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Symptom-Medication Matrix */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Pill className="w-4 h-4 text-emerald-600" />
            <h4 className="font-bold text-sm text-slate-900">Symptom-Medication Correlation</h4>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-900">Gabapentin &harr; Neuropathy</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  r = -0.71 (Effective)
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Burning decreased from 8/10 to 4/10, though nocturnal tingling remains troublesome.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-900">Lisinopril &harr; Blood Pressure</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  r = +0.44 (Suboptimal)
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Blood pressure has escaped single-agent control (148/92). Consider adding Amlodipine 5mg.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50/60 border border-red-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-red-900">Neuropathy &harr; Foot Callous</span>
                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                  Ulcer Risk: High
                </span>
              </div>
              <p className="text-xs text-red-700 leading-relaxed">
                Loss of protective sensation under 1st metatarsal requires urgent podiatry offloading.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
