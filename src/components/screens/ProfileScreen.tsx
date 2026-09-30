"use client";

import React, { useState } from "react";
import { 
  User, 
  Stethoscope, 
  ShieldCheck, 
  Hospital, 
  Award, 
  Sliders, 
  Bell, 
  Mic, 
  FileText, 
  LogOut, 
  CheckCircle2, 
  Sparkles,
  Clock,
  Activity,
  Layers
} from "lucide-react";

interface ProfileScreenProps {
  clinician: { name: string; role: string; department: string; npi: string };
  onSignOut: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ clinician, onSignOut }) => {
  const [ambientNoiseFilter, setAmbientNoiseFilter] = useState(true);
  const [autoDraftReferrals, setAutoDraftReferrals] = useState(true);
  const [criticalAllergyAlerts, setCriticalAllergyAlerts] = useState(true);
  const [docFormat, setDocFormat] = useState<"SOAP" | "SBAR">("SOAP");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-md shadow-emerald-500/20 shrink-0">
          AT
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h1 className="text-2xl font-bold text-slate-900">{clinician.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{clinician.role}</p>
            </div>

            <button
              onClick={onSignOut}
              className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition self-center sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Hospital className="w-4 h-4 text-blue-500" />
              <span>St. Jude Metropolitan Medical Center</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>NPI: <span className="font-mono text-slate-800">{clinician.npi}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Productivity Stats */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400 mb-4">
          Clinical Efficiency Telemetry
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <span className="text-xs font-semibold">Encounters</span>
              <Activity className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-slate-900">142</p>
            <p className="text-[11px] text-slate-500">Total recorded</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
            <div className="flex items-center justify-between text-blue-600 mb-1">
              <span className="text-xs font-semibold">Time Saved</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-slate-900">42.6 <span className="text-xs font-normal">hrs</span></p>
            <p className="text-[11px] text-slate-500">~18 min/patient</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
            <div className="flex items-center justify-between text-purple-600 mb-1">
              <span className="text-xs font-semibold">AI Acceptance</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-slate-900">99.4%</p>
            <p className="text-[11px] text-slate-500">Citation accuracy</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-semibold">Audit Status</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">100%</p>
            <p className="text-[11px] text-slate-500">HIPAA Compliant</p>
          </div>
        </div>
      </div>

      {/* Clinician Preferences & AI Settings */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">AI Assistant & Consultation Settings</h2>
            <p className="text-xs text-slate-500">Customize ambient recording behavior, note formats, and alert triggers</p>
          </div>
          {savedSuccess && (
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Preferences Saved
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Ambient Clinical Noise Cancellation</p>
                <p className="text-[11px] text-slate-500">Filters HVAC and hospital background sounds during recording</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={ambientNoiseFilter}
              onChange={(e) => setAmbientNoiseFilter(e.target.checked)}
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Auto-Draft Specialist Referral Letters</p>
                <p className="text-[11px] text-slate-500">Automatically generate referral letters when consultation orders specialty care</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoDraftReferrals}
              onChange={(e) => setAutoDraftReferrals(e.target.checked)}
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Critical Drug Allergy High-Visibility Banner</p>
                <p className="text-[11px] text-slate-500">Enforce bright red alert pill whenever patient has known anaphylactic allergies</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={criticalAllergyAlerts}
              onChange={(e) => setCriticalAllergyAlerts(e.target.checked)}
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Clinical Documentation Schema</p>
                <p className="text-[11px] text-slate-500">Default format for ambient synthesis</p>
              </div>
            </div>
            <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setDocFormat("SOAP")}
                className={`px-3 py-1 rounded-lg transition ${docFormat === "SOAP" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
              >
                SOAP
              </button>
              <button
                onClick={() => setDocFormat("SBAR")}
                className={`px-3 py-1 rounded-lg transition ${docFormat === "SBAR" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
              >
                SBAR
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
        >
          Save Clinical Preferences
        </button>
      </div>
    </div>
  );
};
