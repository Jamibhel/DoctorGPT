"use client";

import React from "react";
import { 
  Mic, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  FileText,
  ShieldAlert,
  ChevronRight,
  Activity
} from "lucide-react";
import { Patient } from "@/types/clinical";

interface HomeScreenProps {
  clinician: { name: string; role: string; department: string; npi: string };
  patients: Patient[];
  activePatient: Patient;
  onSelectPatient: (patient: Patient) => void;
  onNavigate: (tab: "home" | "encounter" | "patients" | "trends" | "profile") => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  clinician,
  patients,
  activePatient,
  onSelectPatient,
  onNavigate
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Doctor Status Banner */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>{clinician.department}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Good morning, {clinician.name}
            </h1>
            <p className="text-emerald-50 text-sm mt-1 max-w-lg">
              You have 3 patient consultations scheduled for today. AI ambient listener is ready.
            </p>
          </div>

          <button
            onClick={() => onNavigate("encounter")}
            className="self-start sm:self-center px-5 py-3.5 bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-sm rounded-2xl shadow-lg shadow-black/10 flex items-center space-x-2.5 transition transform active:scale-95 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <span>Start Consultation</span>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </div>

      {/* Quick Productivity Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Today's Visits</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">3 <span className="text-xs text-slate-400 font-normal">/ 8</span></p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">2 in queue</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Time Saved</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">4.2 <span className="text-xs text-slate-400 font-normal">hrs</span></p>
          <p className="text-[11px] text-slate-500 mt-1">Ambient auto-SOAP</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Action Accuracy</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">99.4%</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Grounded citations</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Alerts</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">2 <span className="text-xs text-slate-400 font-normal">gaps</span></p>
          <p className="text-[11px] text-red-500 font-medium mt-1">Overdue HbA1c</p>
        </div>
      </div>

      {/* Today's Patient Queue Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Today's Patient Queue</h2>
            <p className="text-xs text-slate-500">Select a patient to review chart or begin ambient encounter</p>
          </div>
          <button
            onClick={() => onNavigate("patients")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Patients</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {patients.map((patient) => {
            const isSelected = patient.id === activePatient.id;
            const hasAllergy = patient.allergies && patient.allergies.length > 0;

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400"
                    : "bg-slate-50/50 hover:bg-slate-100/70 border-slate-200/70"
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                    isSelected ? "bg-emerald-600 text-white" : "bg-blue-100 text-blue-700"
                  }`}>
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{patient.firstName} {patient.lastName}</span>
                      <span className="text-xs text-slate-500">
                        ({patient.gender})
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-0.5">
                      MRN: <span className="font-mono text-slate-700">{patient.mrn}</span> • Primary: {patient.conditions[0] || "Routine"}
                    </p>
                  </div>
                </div>

                {/* Patient tags: Allergy & Status */}
                <div className="flex items-center space-x-2 self-start sm:self-center">
                  {hasAllergy && (
                    <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-medium flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-red-500" />
                      Allergy: {patient.allergies[0].allergen}
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPatient(patient);
                      onNavigate("encounter");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                  >
                    <span>Consult</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div 
          onClick={() => onNavigate("trends")}
          className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:border-emerald-300 transition cursor-pointer flex items-center space-x-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm">Longitudinal Health Trends</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              6-month HbA1c curves, blood pressure variance &amp; medication efficacy.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </div>

        <div 
          onClick={() => onNavigate("profile")}
          className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:border-blue-300 transition cursor-pointer flex items-center space-x-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm">Doctor Profile &amp; Settings</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Review NPI credentials, hospital telemetry, and ambient AI settings.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </div>
      </div>
    </div>
  );
};
