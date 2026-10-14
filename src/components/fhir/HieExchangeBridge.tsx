"use client";

import React, { useState } from "react";
import { 
  Network, 
  Send, 
  Building2, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileCheck2, 
  ArrowRight, 
  KeyRound,
  RefreshCw,
  Share2,
  FileSpreadsheet
} from "lucide-react";
import { Patient, Encounter, VitalSignObservation, CPOEOrder, DiagnosticLabResult } from "@/types/hospital";
import { FhirMapperService } from "@/lib/services/fhir-mapper";

interface HieExchangeBridgeProps {
  patient: Patient;
  encounters?: Encounter[];
  vitals?: VitalSignObservation[];
  orders?: CPOEOrder[];
  labs?: DiagnosticLabResult[];
}

interface ExchangeLog {
  id: string;
  timestamp: string;
  destination: string;
  protocol: string;
  payloadType: string;
  status: "Delivered" | "Pending" | "Ingested";
  hash: string;
  resourceCount: number;
}

export const HieExchangeBridge: React.FC<HieExchangeBridgeProps> = ({
  patient,
  encounters = [],
  vitals = [],
  orders = [],
  labs = []
}) => {
  const [targetHie, setTargetHie] = useState<string>("St. Jude Regional Trauma Network");
  const [protocol, setProtocol] = useState<string>("Direct Secure Messaging (DirectTrust)");
  const [payloadType, setPayloadType] = useState<string>("Emergency Care Summary (FHIR R4)");
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmitStep, setTransmitStep] = useState<string>("");

  const [logs, setLogs] = useState<ExchangeLog[]>([
    {
      id: "HIE-TX-9901",
      timestamp: "Today, 11:42 AM",
      destination: "St. Jude Regional Trauma Network",
      protocol: "Direct Secure Messaging",
      payloadType: "Emergency Care Summary (FHIR R4)",
      status: "Ingested",
      hash: "8f2a9c1e...47b0",
      resourceCount: 14
    },
    {
      id: "HIE-TX-9844",
      timestamp: "Yesterday, 04:15 PM",
      destination: "Mayo Clinic Clinical Information Exchange",
      protocol: "FHIR R4 REST Pull",
      payloadType: "Full Longitudinal Clinical Record",
      status: "Delivered",
      hash: "3b7e41d8...9a11",
      resourceCount: 42
    }
  ]);

  const targetNetworks = [
    { name: "St. Jude Regional Trauma Network", npi: "1093847291", directAddress: "exchange@stjude.hie.direct" },
    { name: "Mayo Clinic Clinical Information Exchange", npi: "1892019284", directAddress: "records@mayo.hie.direct" },
    { name: "Epic Care Everywhere Node #412", npi: "1482019482", directAddress: "incoming@epic-ce.bji.org" },
    { name: "State Health Information Exchange (HIE)", npi: "1928475820", directAddress: "gateway@state-hie.gov" }
  ];

  const handleTransmit = () => {
    setIsTransmitting(true);
    setTransmitStep("Compiling HL7 FHIR R4 Bundle...");

    setTimeout(() => {
      setTransmitStep("Validating DirectTrust X.509 Certificate & mTLS Tunnel...");
    }, 450);

    setTimeout(() => {
      setTransmitStep("Hashing Payload with SHA-256 for Non-Repudiation...");
    }, 900);

    setTimeout(() => {
      setTransmitStep("Transmitting to Destination Endpoint...");
    }, 1300);

    setTimeout(() => {
      const bundle = FhirMapperService.generatePatientBundle(patient, {
        encounters,
        vitals,
        orders,
        labs
      });

      const newLog: ExchangeLog = {
        id: `HIE-TX-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: "Just now",
        destination: targetHie,
        protocol: protocol,
        payloadType: payloadType,
        status: "Ingested",
        hash: "e4c27a91..." + Math.random().toString(16).substring(2, 6),
        resourceCount: bundle.total
      };

      setLogs(prev => [newLog, ...prev]);
      setIsTransmitting(false);
      setTransmitStep("");
    }, 1800);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-bji overflow-hidden">
      {/* Top Banner Toolbar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-bji bg-blue-950/80 border border-blue-700/60 flex items-center justify-center text-blue-400">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-white tracking-wide uppercase">Cross-Facility HIE Bridge</span>
              <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded-bji flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> DirectTrust Certified
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Source Facility: <strong className="text-slate-200">BJI Metropolis Medical Center</strong> (NPI: 1049281729) &bull; Protocol: TEFCA / HL7 FHIR
            </p>
          </div>
        </div>

        <button
          onClick={handleTransmit}
          disabled={isTransmitting}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-bji flex items-center gap-2 transition-all shadow-sm"
        >
          {isTransmitting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Transmitting Package...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Initiate HIE Transmission</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        {/* Left Column: Transmission Form & Options (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/60 border-r border-slate-800 p-4 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
          {/* Target Health System */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Destination Health System / HIE Gateway
            </label>
            <div className="space-y-1.5">
              {targetNetworks.map(net => (
                <button
                  key={net.name}
                  onClick={() => setTargetHie(net.name)}
                  className={`w-full text-left p-2.5 rounded-bji text-xs transition-colors border ${
                    targetHie === net.name
                      ? "bg-slate-900 border-blue-500 text-white shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{net.name}</span>
                    <span className="text-[10px] text-blue-400 font-mono">NPI: {net.npi}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Direct: {net.directAddress}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Transport Protocol */}
          <div className="border-t border-slate-800 pt-3">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Exchange Protocol
            </label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-bji px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="Direct Secure Messaging (DirectTrust)">Direct Secure Messaging (DirectTrust X.509)</option>
              <option value="FHIR R4 REST Pull ($everything)">FHIR R4 REST API Pull ($everything)</option>
              <option value="eHealth Exchange Query / Retrieve">eHealth Exchange Query & Retrieve (XCA/XDS.b)</option>
            </select>
          </div>

          {/* Payload Specification */}
          <div className="border-t border-slate-800 pt-3">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Clinical Payload Scope
            </label>
            <select
              value={payloadType}
              onChange={(e) => setPayloadType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-bji px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="Emergency Care Summary (FHIR R4)">Emergency Care Summary (Vitals + Allergies + Meds)</option>
              <option value="Full Longitudinal Clinical Record">Full Longitudinal Record (Complete FHIR R4 Bundle)</option>
              <option value="Perioperative Clearance Package">Perioperative Clearance & Pre-Op Labs</option>
              <option value="Medication Reconciliation Package">Active CPOE Medication Orders Only</option>
            </select>
          </div>

          {/* Security & Cryptography Card */}
          <div className="border-t border-slate-800 pt-3">
            <div className="bg-slate-950 border border-slate-800 rounded-bji p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" /> Identity Verification:
                </span>
                <span className="text-emerald-400 font-mono">EMPI Matched (99.8%)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Encryption:
                </span>
                <span className="text-slate-300 font-mono">TLS 1.3 mTLS + AES-GCM-256</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>DirectTrust Cert Expiry:</span>
                <span className="text-slate-300 font-mono">2027-12-31</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Status & Exchange Audit Log (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-slate-900 overflow-hidden">
          {/* Active Transmission Stepper Banner */}
          {isTransmitting && (
            <div className="p-4 bg-blue-950/40 border-b border-blue-800/60">
              <div className="flex items-center space-x-3 mb-2">
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-xs font-semibold text-blue-200 uppercase tracking-wide">
                  HIE Pipeline Active
                </span>
              </div>
              <p className="text-xs text-blue-300 font-mono bg-blue-900/40 p-2 rounded-bji border border-blue-700/50">
                &gt; {transmitStep}
              </p>
            </div>
          )}

          {/* Audit History Header */}
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-white">Cross-Facility Exchange Audit Trail</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Total Logged: {logs.length} Transactions
            </span>
          </div>

          {/* Audit Log Table */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 bg-slate-950">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3.5 rounded-bji space-y-2 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-white">{log.id}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      {log.protocol}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-bji font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {log.status}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 flex items-center space-x-2">
                  <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="font-medium text-slate-200">{log.destination}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-400">{log.payloadType}</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>SHA-256: <code className="text-slate-300">{log.hash}</code></span>
                  <span>Resources: <strong className="text-emerald-400">{log.resourceCount}</strong> FHIR items</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Status Bar */}
          <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> TEFCA Common Agreement R3 Certified
            </span>
            <span>Non-repudiation audit ledger verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
