"use client";

import React, { useState, useMemo } from "react";
import { 
  Database, 
  Terminal, 
  Share2, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  Users, 
  Activity, 
  FileCode, 
  Search,
  ExternalLink
} from "lucide-react";
import { useHospital } from "@/lib/state/hospital-store";
import { FhirMapperService } from "@/lib/services/fhir-mapper";
import { FhirBundleViewer } from "./FhirBundleViewer";
import { SmartOnFhirConsole } from "./SmartOnFhirConsole";
import { HieExchangeBridge } from "./HieExchangeBridge";

type FhirTab = "bundle" | "smart" | "hie";

export const FhirInteroperabilityWorkspace: React.FC = () => {
  const { 
    patients, 
    activePatient, 
    setActivePatientId, 
    encounters, 
    observations, 
    orders, 
    labs, 
    imaging 
  } = useHospital();

  const [activeTab, setActiveTab] = useState<FhirTab>("bundle");

  // Filter clinical data for active patient
  const patientEncounters = useMemo(() => {
    return encounters.filter(e => e.patientId === activePatient.id);
  }, [encounters, activePatient.id]);

  const patientVitals = useMemo(() => {
    return observations.filter(o => o.patientId === activePatient.id);
  }, [observations, activePatient.id]);

  const patientOrders = useMemo(() => {
    return orders.filter(o => o.patientId === activePatient.id);
  }, [orders, activePatient.id]);

  const patientLabs = useMemo(() => {
    return labs.filter(l => l.patientId === activePatient.id);
  }, [labs, activePatient.id]);

  // Generate FHIR R4 Bundle for the active patient
  const activeBundle = useMemo(() => {
    return FhirMapperService.generatePatientBundle(activePatient, {
      encounters: patientEncounters,
      vitals: patientVitals,
      orders: patientOrders,
      labs: patientLabs
    });
  }, [activePatient, patientEncounters, patientVitals, patientOrders, patientLabs]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header & Patient Selector */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-bji bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold tracking-tight text-white uppercase">
                  Enterprise FHIR R4 Interoperability Gateway
                </h1>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded-bji font-mono font-medium">
                  HL7 FHIR Release 4 (4.0.1)
                </span>
                <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/50 px-1.5 py-0.5 rounded-bji font-mono font-medium">
                  US Core IG v6.1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ONC §170.315(g)(10) Standardized API &bull; SMART Backend Services &bull; TEFCA HIE Exchange
              </p>
            </div>
          </div>

          {/* Active Patient Selector */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-bji">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Patient:</span>
            <select
              value={activePatient.id}
              onChange={(e) => setActivePatientId(e.target.value)}
              className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.lastName}, {p.firstName} (MRN: {p.mrn})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clinical FHIR Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-slate-800 p-2 rounded-bji flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">Exportable Resources</span>
              <span className="text-sm font-bold text-white font-mono">{activeBundle.total} FHIR items</span>
            </div>
            <FileCode className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-2 rounded-bji flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">FHIR Conformance</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">100% US Core</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-2 rounded-bji flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">SMART REST Endpoints</span>
              <span className="text-sm font-bold text-blue-400 font-mono">7 APIs Active</span>
            </div>
            <Terminal className="w-4 h-4 text-blue-400" />
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-2 rounded-bji flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">HIE Direct Bridge</span>
              <span className="text-sm font-bold text-purple-400 font-mono">DirectTrust OK</span>
            </div>
            <Share2 className="w-4 h-4 text-purple-400" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 mt-3">
          <button
            onClick={() => setActiveTab("bundle")}
            className={`px-3 py-1.5 rounded-bji text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "bundle"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>FHIR R4 Patient Bundle</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              activeTab === "bundle" ? "bg-emerald-800 text-emerald-100" : "bg-slate-800 text-slate-400"
            }`}>
              {activeBundle.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("smart")}
            className={`px-3 py-1.5 rounded-bji text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "smart"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SMART on FHIR REST Console</span>
          </button>

          <button
            onClick={() => setActiveTab("hie")}
            className={`px-3 py-1.5 rounded-bji text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "hie"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Cross-Facility HIE Bridge</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 p-3 overflow-hidden">
        {activeTab === "bundle" && (
          <FhirBundleViewer
            bundle={activeBundle}
            patientName={`${activePatient.lastName}, ${activePatient.firstName}`}
          />
        )}

        {activeTab === "smart" && (
          <SmartOnFhirConsole
            patient={activePatient}
            encounters={patientEncounters}
            vitals={patientVitals}
            orders={patientOrders}
            labs={patientLabs}
          />
        )}

        {activeTab === "hie" && (
          <HieExchangeBridge
            patient={activePatient}
            encounters={patientEncounters}
            vitals={patientVitals}
            orders={patientOrders}
            labs={patientLabs}
          />
        )}
      </div>
    </div>
  );
};
