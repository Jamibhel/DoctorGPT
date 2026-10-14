"use client";

import React, { useState } from "react";
import { 
  Terminal, 
  Play, 
  Shield, 
  Key, 
  Clock, 
  CheckCircle2, 
  Copy, 
  RefreshCw,
  ExternalLink,
  Lock,
  Layers
} from "lucide-react";
import { Patient, Encounter, VitalSignObservation, CPOEOrder, DiagnosticLabResult } from "@/types/hospital";
import { FhirMapperService } from "@/lib/services/fhir-mapper";

interface SmartOnFhirConsoleProps {
  patient: Patient;
  encounters?: Encounter[];
  vitals?: VitalSignObservation[];
  orders?: CPOEOrder[];
  labs?: DiagnosticLabResult[];
}

export const SmartOnFhirConsole: React.FC<SmartOnFhirConsoleProps> = ({
  patient,
  encounters = [],
  vitals = [],
  orders = [],
  labs = []
}) => {
  const patientId = patient.id.replace("Patient/", "");

  const endpoints = [
    { label: "GET /Patient/{id}", endpoint: `Patient/${patientId}`, method: "GET" },
    { label: "GET /Patient/{id}/$everything", endpoint: `Patient/${patientId}/$everything`, method: "GET" },
    { label: "GET /Observation (Vital Signs)", endpoint: "Observation", method: "GET", params: { patient: patientId, category: "vital-signs" } },
    { label: "GET /Condition (Active)", endpoint: "Condition", method: "GET", params: { patient: patientId, "clinical-status": "active" } },
    { label: "GET /MedicationRequest", endpoint: "MedicationRequest", method: "GET", params: { patient: patientId } },
    { label: "GET /DiagnosticReport", endpoint: "DiagnosticReport", method: "GET", params: { patient: patientId } },
    { label: "POST /Bundle (Transaction)", endpoint: "Bundle", method: "POST" }
  ];

  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string> | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const activeEndpoint = endpoints[selectedEndpointIndex];

  const handleExecute = async () => {
    setIsRunning(true);
    setResponseOutput(null);

    // Call simulated SMART FHIR query
    setTimeout(() => {
      const res = FhirMapperService.simulateFhirRestQuery(
        activeEndpoint.endpoint,
        activeEndpoint.params || {},
        {
          patient,
          encounters,
          vitals,
          orders,
          labs
        }
      );

      setResponseOutput(res.body);
      setResponseHeaders(res.headers);
      setResponseStatus(res.status);
      setLatency(res.latencyMs);
      setIsRunning(false);
    }, 280);
  };

  const handleCopy = () => {
    if (!responseOutput) return;
    navigator.clipboard.writeText(JSON.stringify(responseOutput, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-bji overflow-hidden">
      {/* Top SMART-on-FHIR Security Context Bar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-bji bg-blue-950/80 border border-blue-700/60 flex items-center justify-center text-blue-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-white tracking-wide uppercase">SMART on FHIR REST API Console</span>
              <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/50 px-1.5 py-0.5 rounded-bji flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3 text-blue-400" /> OAuth 2.0 Bearer Authenticated
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Client: <code className="text-slate-300 font-mono">bji-clinical-portal</code> &bull; Scope: <code className="text-slate-300 font-mono">patient/*.read launch/patient offline_access</code>
            </p>
          </div>
        </div>

        {/* Quick Launch Button */}
        <button
          onClick={handleExecute}
          disabled={isRunning}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-bji flex items-center gap-2 transition-all shadow-sm"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Query...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run FHIR Request</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        {/* Left Column: Endpoints & Request Headers (4 cols) */}
        <div className="lg:col-span-4 bg-slate-950/60 border-r border-slate-800 p-4 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Select SMART Endpoint
            </label>
            <div className="space-y-1.5">
              {endpoints.map((ep, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedEndpointIndex(idx);
                    setResponseOutput(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-bji text-xs font-mono transition-colors flex items-center justify-between ${
                    selectedEndpointIndex === idx
                      ? "bg-blue-600 text-white font-semibold shadow-sm"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      ep.method === 'GET' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-purple-950 text-purple-400 border border-purple-800'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="truncate">{ep.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Request Header Inspector */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                HTTP Request Headers
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Standard SMART</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-bji p-3 font-mono text-[11px] text-slate-300 space-y-1.5">
              <div>
                <span className="text-slate-500">Accept:</span> <span className="text-blue-400">application/fhir+json</span>
              </div>
              <div className="truncate">
                <span className="text-slate-500">Authorization:</span> <span className="text-emerald-400">Bearer bji_token_live_***</span>
              </div>
              <div>
                <span className="text-slate-500">X-Request-ID:</span> <span className="text-slate-400">req-bji-89a174</span>
              </div>
              <div>
                <span className="text-slate-500">Prefer:</span> <span className="text-slate-400">handling=strict</span>
              </div>
            </div>
          </div>

          {/* Security Context Details */}
          <div className="border-t border-slate-800 pt-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              SMART Patient Context
            </span>
            <div className="bg-slate-950 border border-slate-800 rounded-bji p-3 text-xs space-y-1 text-slate-300">
              <p>Active Patient: <strong className="text-white">{patient.lastName}, {patient.firstName}</strong></p>
              <p className="font-mono text-[11px] text-slate-400">FHIR ID: {patientId}</p>
              <p className="font-mono text-[11px] text-slate-400">MRN: {patient.mrn}</p>
              <p className="font-mono text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Launch Context Bound
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Response Explorer (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-slate-900 overflow-hidden">
          {/* Response Telemetry Banner */}
          <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-slate-400 font-medium">Response Telemetry:</span>
              {responseStatus ? (
                <span className={`px-2 py-0.5 rounded-bji font-mono text-[11px] font-bold ${
                  responseStatus === 200 ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                  responseStatus === 201 ? "bg-blue-950 text-blue-400 border border-blue-800" :
                  "bg-amber-950 text-amber-400 border border-amber-800"
                }`}>
                  HTTP {responseStatus} {responseStatus === 200 ? "OK" : responseStatus === 201 ? "Created" : "Processed"}
                </span>
              ) : (
                <span className="text-slate-500 font-mono text-[11px]">Ready (Idle)</span>
              )}

              {latency !== null && (
                <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" /> {latency}ms
                </span>
              )}
            </div>

            {responseOutput && (
              <button
                onClick={handleCopy}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-bji flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? "Copied!" : "Copy Payload"}</span>
              </button>
            )}
          </div>

          {/* Response Payload Viewer */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-950">
            {isRunning ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-slate-200">Executing FHIR R4 Request...</p>
                <p className="text-xs text-slate-400 mt-1 font-mono">Dispatching to SMART API Gateway at https://bji.health/api/fhir/r4</p>
              </div>
            ) : responseOutput ? (
              <pre className="font-mono text-[11px] text-blue-300 leading-relaxed overflow-x-auto selection:bg-blue-950 selection:text-white">
                {JSON.stringify(responseOutput, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <Terminal className="w-10 h-10 mb-3 text-slate-700 stroke-1" />
                <h4 className="text-sm font-semibold text-slate-300">Ready to execute query</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Click &quot;Run FHIR Request&quot; above to simulate real-time query execution against the BJI FHIR R4 REST API.
                </p>
              </div>
            )}
          </div>

          {/* Response Headers Footer Drawer */}
          {responseHeaders && (
            <div className="bg-slate-950/80 px-4 py-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                <span className="text-slate-500">ETag:</span> <span className="text-slate-300">{responseHeaders["ETag"]}</span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-500">Content-Type:</span> <span className="text-slate-300">{responseHeaders["Content-Type"]}</span>
              </div>
              <span className="text-slate-500">FHIR R4 / 4.0.1</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
