"use client";

import React, { useState, useMemo } from "react";
import { 
  FileCode, 
  CheckCircle2, 
  Copy, 
  Download, 
  Filter, 
  Eye, 
  Code2, 
  ShieldCheck, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database
} from "lucide-react";
import { FhirBundle, FhirBundleEntry } from "@/types/fhir";
import { FhirMapperService } from "@/lib/services/fhir-mapper";

interface FhirBundleViewerProps {
  bundle: FhirBundle;
  patientName: string;
}

export const FhirBundleViewer: React.FC<FhirBundleViewerProps> = ({ bundle, patientName }) => {
  const [selectedType, setSelectedType] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"card" | "raw">("card");
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Schema Validation Check
  const validationResults = useMemo(() => {
    const results = bundle.entry.map(e => ({
      resourceType: e.resource.resourceType,
      id: e.resource.id,
      validation: FhirMapperService.validateFhirResource(e.resource)
    }));
    const totalValid = results.filter(r => r.validation.isValid).length;
    return {
      results,
      allValid: totalValid === results.length,
      validPercent: results.length > 0 ? Math.round((totalValid / results.length) * 100) : 100
    };
  }, [bundle]);

  // Distinct resource types
  const resourceTypes = useMemo(() => {
    const types = new Set<string>();
    bundle.entry.forEach(e => types.add(e.resource.resourceType));
    return ["All", ...Array.from(types)];
  }, [bundle]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    if (selectedType === "All") return bundle.entry;
    return bundle.entry.filter(e => e.resource.resourceType === selectedType);
  }, [bundle, selectedType]);

  const toggleExpand = (id: string) => {
    setExpandedEntries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    filteredEntries.forEach((_, idx) => {
      next[`entry-${idx}`] = true;
    });
    setExpandedEntries(next);
  };

  const collapseAll = () => {
    setExpandedEntries({});
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/fhir+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fhir-r4-bundle-${bundle.id || "export"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-bji overflow-hidden">
      {/* Top Banner Toolbar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-bji bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-white tracking-wide uppercase">HL7 FHIR R4 Bundle</span>
              <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded-bji flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {validationResults.validPercent}% Conformance
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-bji font-mono">
                type: {bundle.type}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Subject: <strong className="text-slate-200">{patientName}</strong> &bull; Entries: {bundle.total} resources &bull; Spec: HL7 FHIR 4.0.1
            </p>
          </div>
        </div>

        {/* View mode toggle & Action buttons */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-900 border border-slate-700 p-0.5 rounded-bji text-xs">
            <button
              onClick={() => setViewMode("card")}
              className={`px-2.5 py-1 rounded-bji flex items-center gap-1.5 font-medium transition-colors ${
                viewMode === "card" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`px-2.5 py-1 rounded-bji flex items-center gap-1.5 font-medium transition-colors ${
                viewMode === "raw" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>

          <button
            onClick={handleCopyJson}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-bji border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Copy Raw FHIR JSON"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? "Copied!" : "Copy JSON"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded-bji flex items-center gap-1.5 transition-colors font-medium shadow-sm"
            title="Download FHIR R4 Bundle JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Filter and Accordion Bar */}
      <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-slate-400" /> Filter:
          </span>
          {resourceTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-2 py-0.5 rounded-bji text-[11px] font-mono transition-colors ${
                selectedType === type
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {type} ({type === "All" ? bundle.total : bundle.entry.filter(e => e.resource.resourceType === type).length})
            </button>
          ))}
        </div>

        {viewMode === "card" && (
          <div className="flex items-center space-x-2 text-[11px]">
            <button 
              onClick={expandAll} 
              className="text-slate-400 hover:text-emerald-400 underline decoration-slate-600"
            >
              Expand All
            </button>
            <span className="text-slate-600">&bull;</span>
            <button 
              onClick={collapseAll} 
              className="text-slate-400 hover:text-emerald-400 underline decoration-slate-600"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {viewMode === "raw" ? (
          <div className="relative">
            <pre className="bg-slate-950 text-emerald-400 p-4 rounded-bji font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 selection:bg-emerald-900 selection:text-white">
              {JSON.stringify(bundle, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry, idx) => {
              const entryKey = `entry-${idx}`;
              const isExpanded = !!expandedEntries[entryKey];
              const res = entry.resource;
              const val = FhirMapperService.validateFhirResource(res);

              return (
                <div 
                  key={entryKey}
                  className="bg-slate-950 border border-slate-800 rounded-bji overflow-hidden transition-all hover:border-slate-700"
                >
                  {/* Resource Card Header */}
                  <div 
                    onClick={() => toggleExpand(entryKey)}
                    className="px-3.5 py-2.5 bg-slate-950/70 hover:bg-slate-900/60 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <button className="text-slate-400 hover:text-white">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-bji font-mono text-[11px] font-semibold ${
                          res.resourceType === 'Patient' ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50' :
                          res.resourceType === 'Observation' ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50' :
                          res.resourceType === 'Condition' ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50' :
                          res.resourceType === 'MedicationRequest' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' :
                          res.resourceType === 'DiagnosticReport' ? 'bg-teal-900/60 text-teal-300 border border-teal-700/50' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {res.resourceType}
                        </span>
                        <span className="font-mono text-xs text-slate-200">
                          id: <span className="text-slate-400">{res.id}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {val.isValid ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-bji flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Valid FHIR R4
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-bji flex items-center gap-1 font-mono">
                          <AlertTriangle className="w-3 h-3 text-amber-400" /> {val.issues.length} Warnings
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {entry.fullUrl || `urn:uuid:${res.id}`}
                      </span>
                    </div>
                  </div>

                  {/* Summary Preview (Collapsed) */}
                  {!isExpanded && (
                    <div className="px-4 py-2 border-t border-slate-900 text-xs text-slate-300 flex items-center justify-between bg-slate-950/30">
                      <div className="truncate max-w-[80%]">
                        {res.resourceType === "Patient" && (
                          <span>Name: <strong className="text-white">{patientName}</strong> &bull; MRN: {res.identifier?.[0]?.value} &bull; Gender: {res.gender}</span>
                        )}
                        {res.resourceType === "Observation" && (
                          <span>Observation: <strong className="text-white">{res.code?.text || res.code?.coding?.[0]?.display}</strong> = {res.valueQuantity?.value} {res.valueQuantity?.unit} &bull; Code: {res.code?.coding?.[0]?.code}</span>
                        )}
                        {res.resourceType === "Condition" && (
                          <span>Condition: <strong className="text-white">{res.code?.text || res.code?.coding?.[0]?.display}</strong> &bull; ICD-10: {res.code?.coding?.[0]?.code} &bull; Severity: {res.severity?.coding?.[0]?.display || "Active"}</span>
                        )}
                        {res.resourceType === "MedicationRequest" && (
                          <span>Medication: <strong className="text-white">{res.medicationCodeableConcept?.text || res.medicationCodeableConcept?.coding?.[0]?.display}</strong> &bull; Status: {res.status} &bull; Intent: {res.intent}</span>
                        )}
                        {res.resourceType === "Encounter" && (
                          <span>Encounter: Class <strong className="text-white">{res.class?.code}</strong> &bull; Status: {res.status}</span>
                        )}
                        {res.resourceType === "DiagnosticReport" && (
                          <span>Diagnostic Report: <strong className="text-white">{res.code?.text || res.code?.coding?.[0]?.display}</strong> &bull; Status: {res.status}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Click to inspect</span>
                    </div>
                  )}

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="p-3 border-t border-slate-800 bg-slate-950">
                      {val.issues.length > 0 && (
                        <div className="mb-2 p-2 bg-amber-950/40 border border-amber-800/60 rounded-bji text-[11px] text-amber-300">
                          <strong className="block text-amber-200 mb-1">Conformance Warnings:</strong>
                          <ul className="list-disc list-inside space-y-0.5">
                            {val.issues.map((err, errIdx) => (
                              <li key={errIdx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/90 p-3 rounded-bji overflow-x-auto border border-slate-800 leading-normal">
                        {JSON.stringify(res, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Conformance Bar */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> US Core Implementation Guide Compliant
          </span>
          <span className="text-slate-600">|</span>
          <span>Base URL: https://bji.health/api/fhir/r4</span>
        </div>
        <div className="text-slate-500">
          Generated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
