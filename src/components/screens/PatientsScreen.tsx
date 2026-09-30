"use client";

import React, { useState } from "react";
import { 
  Users, 
  Search, 
  ShieldAlert, 
  Pill, 
  Activity, 
  TrendingUp, 
  Mic, 
  ArrowRight
} from "lucide-react";
import { Patient } from "@/types/clinical";

interface PatientsScreenProps {
  patients: Patient[];
  activePatient: Patient;
  onSelectPatient: (patient: Patient) => void;
  onNavigate: (tab: "home" | "encounter" | "patients" | "trends" | "profile") => void;
}

export const PatientsScreen: React.FC<PatientsScreenProps> = ({
  patients,
  activePatient,
  onSelectPatient,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.conditions.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-xs text-slate-500">Longitudinal records, active care gaps, and clinical history</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, MRN, condition..."
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
      </div>

      {/* Patient List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPatients.map((patient) => {
          const isSelected = patient.id === activePatient.id;
          const allergies = patient.allergies || [];
          const conditions = patient.conditions || [];
          const medications = patient.medications || [];

          return (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient)}
              className={`bg-white rounded-3xl p-5 sm:p-6 border transition cursor-pointer flex flex-col justify-between ${
                isSelected 
                  ? "border-emerald-400 ring-2 ring-emerald-400/20 shadow-sm" 
                  : "border-slate-200/80 hover:border-slate-300 shadow-sm"
              }`}
            >
              {/* Top Row: Avatar, Name, MRN */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base ${
                      isSelected ? "bg-emerald-600 text-white" : "bg-blue-100 text-blue-700"
                    }`}>
                      {patient.firstName[0]}{patient.lastName[0]}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="font-bold text-slate-900 text-base">{patient.firstName} {patient.lastName}</h2>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Active Chart
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {patient.gender} • MRN: <span className="font-mono text-slate-700">{patient.mrn}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Red Allergy Warning Pill */}
                {allergies.length > 0 && (
                  <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="font-semibold">Allergy Alert:</span>
                      <span>{allergies.map(a => a.allergen).join(", ")}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-red-600 px-2 py-0.5 rounded bg-red-100">
                      {allergies[0].severity}
                    </span>
                  </div>
                )}

                {/* Conditions Tags */}
                <div className="mb-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Active Diagnoses
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {conditions.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Medications List */}
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Current Medications
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {medications.map((m, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] border border-blue-100 flex items-center gap-1">
                        <Pill className="w-3 h-3 text-blue-500" />
                        {m.name} ({m.dosage})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPatient(patient);
                    onNavigate("trends");
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 font-medium flex items-center gap-1.5 transition"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>View Trends</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPatient(patient);
                    onNavigate("encounter");
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
