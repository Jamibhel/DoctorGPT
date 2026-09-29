"use client";

import React, { useState } from "react";
import { Activity, ShieldCheck, History, Sparkles, Key, CheckCircle2, AlertCircle } from "lucide-react";
import { Patient } from "@/types/clinical";

interface HeaderProps {
  patients: Patient[];
  selectedPatient: Patient;
  onSelectPatient: (patient: Patient) => void;
  providerName: string;
  onSetProvider: (type: 'mock' | 'gemini', apiKey?: string) => void;
  auditCount: number;
  onOpenAudit: () => void;
  encounterStatus: 'DRAFT' | 'IN_REVIEW' | 'APPROVED';
}

export const Header: React.FC<HeaderProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  providerName,
  onSetProvider,
  auditCount,
  onOpenAudit,
  encounterStatus,
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      onSetProvider('gemini', apiKeyInput.trim());
      setShowKeyModal(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Clinical System Identification */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Clinical Workbench AI</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Synthea $0 Demo (Synthetic)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1" title="Connected to Google Firebase: doctorgpt-a">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Firebase: doctorgpt-a
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Human-in-the-Loop Clinical Encounter-to-Workflow Engine</p>
            </div>
          </div>

          {/* Center Patient Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <span className="text-xs font-medium text-slate-500 px-2">Patient:</span>
            <select
              value={selectedPatient.id}
              onChange={(e) => {
                const found = patients.find((p) => p.id === e.target.value);
                if (found) onSelectPatient(found);
              }}
              className="bg-white text-xs font-semibold text-slate-800 rounded px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.lastName}, {p.firstName} (MRN: {p.mrn})
                </option>
              ))}
            </select>
          </div>

          {/* Right Action Tools: Provider switch, Audit Log, Encounter State */}
          <div className="flex items-center space-x-3">
            {/* AI Provider Indicator & Switch */}
            <div className="relative">
              <button
                onClick={() => setShowKeyModal(true)}
                title="Configure AI Provider & API Keys"
                className="flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition border border-slate-300"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate max-w-[130px]">{providerName.includes('Gemini') ? 'Gemini AI' : '$0 Local Engine'}</span>
              </button>
            </div>

            {/* Audit Trail Button */}
            <button
              onClick={onOpenAudit}
              className="flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition border border-slate-200"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit Log</span>
              {auditCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {auditCount}
                </span>
              )}
            </button>

            {/* Encounter State Badge */}
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
              {encounterStatus === 'APPROVED' ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                </span>
              ) : encounterStatus === 'IN_REVIEW' ? (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                  <AlertCircle className="w-3.5 h-3.5" /> In Review
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-300">
                  Draft
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-slate-900 mb-2">
              <Key className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base">Select AI Provider Layer</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Clinical Workbench AI supports $0 spend local mock execution (Synthea knowledge graph) as well as live Google Gemini Free-Tier models.
            </p>

            <div className="space-y-3">
              <label
                onClick={() => {
                  onSetProvider('mock');
                  setShowKeyModal(false);
                }}
                className="flex items-start p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition border-slate-300"
              >
                <input
                  type="radio"
                  name="provider-radio"
                  defaultChecked={!providerName.includes('Gemini')}
                  className="mt-1 text-blue-600"
                />
                <div className="ml-3">
                  <div className="text-sm font-semibold text-slate-900">Synthea $0 Local Mock Engine</div>
                  <div className="text-xs text-slate-500">100% offline, zero-spend, pre-calibrated clinical reasoning and citations.</div>
                </div>
              </label>

              <div className="p-3 border rounded-lg border-slate-300 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-slate-900">Google Gemini Free-Tier API</div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">Optional</span>
                </div>
                <input
                  type="password"
                  placeholder="Paste your GEMINI_API_KEY..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded text-xs transition"
                >
                  Activate Gemini Provider
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
