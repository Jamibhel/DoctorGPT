"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  Sparkles, 
  CheckCircle, 
  X,
  FileCheck
} from "lucide-react";
import { GeneratedDocument, DocumentType, Patient, SoapNote, ActionItem } from "@/types/clinical";
import { aiOrchestrator } from "@/lib/ai/orchestrator";

interface DocumentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  note: SoapNote;
  actions: ActionItem[];
  documents: GeneratedDocument[];
  onAddDocument: (doc: GeneratedDocument) => void;
  onApproveDocument: (id: string) => void;
  onLogAudit: (action: string, details: string, category: 'AI_GENERATION' | 'APPROVAL') => void;
}

export const DocumentGeneratorModal: React.FC<DocumentGeneratorModalProps> = ({
  isOpen,
  onClose,
  patient,
  note,
  actions,
  documents,
  onAddDocument,
  onApproveDocument,
  onLogAudit,
}) => {
  const [selectedType, setSelectedType] = useState<DocumentType>('REFERRAL_LETTER');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentDoc = documents.find(d => d.id === activeDocId) || documents[0];

  const handleGenerate = async (type: DocumentType) => {
    setIsGenerating(true);
    try {
      const provider = aiOrchestrator.getProvider();
      const newDoc = await provider.generateDocument(type, patient, note, actions);
      onAddDocument(newDoc);
      setActiveDocId(newDoc.id);
      onLogAudit(
        "Clinical Document Auto-Drafted",
        `Generated draft for: ${newDoc.title} (${type})`,
        'AI_GENERATION'
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = (id: string, title: string) => {
    onApproveDocument(id);
    onLogAudit(
      "Clinical Document Approved & Signed",
      `Clinician formally approved clinical document: "${title}"`,
      'APPROVAL'
    );
  };

  const handleCopy = () => {
    if (currentDoc) {
      navigator.clipboard.writeText(currentDoc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Automated Clinical Document Generator
              </h2>
              <p className="text-xs text-slate-500">
                Generate specialist referral letters or patient after-care instructions with 1 tap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Generator Action Buttons Bar */}
        <div className="px-4 sm:px-5 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Auto-Draft:</span>
            <button
              onClick={() => handleGenerate('REFERRAL_LETTER')}
              disabled={isGenerating}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Podiatry Referral
            </button>
            <button
              onClick={() => handleGenerate('PATIENT_INSTRUCTIONS')}
              disabled={isGenerating}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Patient Instructions
            </button>
            <button
              onClick={() => handleGenerate('HANDOVER_SUMMARY')}
              disabled={isGenerating}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Handover Note
            </button>
          </div>

          {currentDoc && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={handlePrint}
                className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Document list */}
          <div className="w-full md:w-64 border-r border-slate-100 bg-slate-50/50 p-3 overflow-y-auto space-y-2 shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Documents ({documents.length})
            </div>
            {documents.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                Click a button above to generate a document.
              </div>
            ) : (
              documents.map((doc) => {
                const isSelected = (currentDoc?.id === doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`w-full p-3 rounded-2xl text-left transition border ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 shadow-xs'
                        : 'border-slate-200/80 bg-white hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-bold text-blue-700">
                        {doc.type.replace('_', ' ')}
                      </span>
                      {doc.status === 'APPROVED' ? (
                        <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 rounded">
                          ✓ Signed
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-100 px-1.5 rounded font-semibold">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xs truncate">{doc.title}</div>
                  </button>
                );
              })
            )}
          </div>

          {/* Document Preview & Signing */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {currentDoc ? (
              <>
                <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{currentDoc.title}</h4>
                    <span className="text-[11px] text-slate-400">Created: {new Date(currentDoc.createdAt).toLocaleString()}</span>
                  </div>

                  <div>
                    {currentDoc.status === 'APPROVED' ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Signed &amp; Approved
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApprove(currentDoc.id, currentDoc.title)}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-sm transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Sign Document</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
                  <pre className="font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    {currentDoc.content}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-6">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700 text-sm">Select a document to preview or generate</p>
                <p className="text-slate-400 mt-1 max-w-sm text-center">
                  Instant synthesis of referral letters, after-care instructions, and care handovers without manual re-typing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
