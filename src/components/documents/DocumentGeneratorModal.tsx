"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Send, 
  Printer, 
  Copy, 
  Check, 
  Sparkles, 
  Download, 
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Automated Clinical Document Generator
              </h2>
              <p className="text-xs text-slate-500">
                Generate formal referral letters, discharge instructions, or handover summaries from the current encounter.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Generator Controls Bar */}
        <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700">Generate New:</span>
            <button
              onClick={() => handleGenerate('REFERRAL_LETTER')}
              disabled={isGenerating}
              className="text-xs font-medium px-2.5 py-1 rounded bg-white hover:bg-blue-50 text-blue-700 border border-slate-300 shadow-2xs transition flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Referral Letter
            </button>
            <button
              onClick={() => handleGenerate('PATIENT_INSTRUCTIONS')}
              disabled={isGenerating}
              className="text-xs font-medium px-2.5 py-1 rounded bg-white hover:bg-blue-50 text-blue-700 border border-slate-300 shadow-2xs transition flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Patient Instructions
            </button>
            <button
              onClick={() => handleGenerate('HANDOVER_SUMMARY')}
              disabled={isGenerating}
              className="text-xs font-medium px-2.5 py-1 rounded bg-white hover:bg-blue-50 text-blue-700 border border-slate-300 shadow-2xs transition flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Handover Summary
            </button>
          </div>

          {currentDoc && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="text-xs font-medium px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={handlePrint}
                className="text-xs font-medium px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          )}
        </div>

        {/* Body Layout: Left document list, Right preview & approve */}
        <div className="flex-1 flex overflow-hidden">
          {/* Document list */}
          <div className="w-64 border-r border-slate-200 bg-slate-50/50 p-3 overflow-y-auto space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Drafted Documents ({documents.length})
            </div>
            {documents.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                No documents generated yet. Click one of the buttons above to draft a document.
              </div>
            ) : (
              documents.map((doc) => {
                const isSelected = (currentDoc?.id === doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`w-full p-2.5 rounded-lg text-left transition border ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-100/70 text-slate-800'
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
                    <div className="font-semibold text-xs line-clamp-1">{doc.title}</div>
                  </button>
                );
              })
            )}
          </div>

          {/* Document Preview & Signing */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {currentDoc ? (
              <>
                <div className="p-3 border-b border-slate-100 bg-white flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{currentDoc.title}</h4>
                    <span className="text-[11px] text-slate-400">Created: {new Date(currentDoc.createdAt).toLocaleString()}</span>
                  </div>

                  <div>
                    {currentDoc.status === 'APPROVED' ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                        <CheckCircle className="w-4 h-4" /> Formally Approved & Signed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApprove(currentDoc.id, currentDoc.title)}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg shadow-sm transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve & Sign Document</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                  <pre className="font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-200">
                    {currentDoc.content}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-6">
                <FileText className="w-12 h-12 text-slate-300 mb-3" />
                <p className="font-medium text-slate-600">Select a document type to auto-generate</p>
                <p className="text-slate-400 mt-1">One encounter generates referral letters, care plans, and instructions without retyping.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
