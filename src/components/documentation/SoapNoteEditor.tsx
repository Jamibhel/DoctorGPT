"use client";

import React, { useState } from "react";
import { 
  FileText, 
  CheckCircle, 
  Edit3, 
  Sparkles, 
  ExternalLink, 
  AlertCircle, 
  Save, 
  RotateCcw,
  Tag
} from "lucide-react";
import { SoapNote } from "@/types/clinical";

interface SoapNoteEditorProps {
  note: SoapNote;
  onUpdateNote: (updatedNote: SoapNote) => void;
  onLogAudit: (action: string, details: string, category: 'USER_EDIT' | 'AI_GENERATION') => void;
  isGeneratingNote: boolean;
  onRegenerateNote: () => void;
}

export const SoapNoteEditor: React.FC<SoapNoteEditorProps> = ({
  note,
  onUpdateNote,
  onLogAudit,
  isGeneratingNote,
  onRegenerateNote,
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'subjective' | 'objective' | 'assessment' | 'plan'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState<SoapNote>(note);
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);

  // Sync state if props change when not in active edit mode
  React.useEffect(() => {
    if (!isEditing) {
      setEditedNote(note);
    }
  }, [note, isEditing]);

  const handleSaveEdits = () => {
    onUpdateNote(editedNote);
    setIsEditing(false);
    onLogAudit(
      "SOAP Note Edited by Clinician",
      `Clinician modified and updated structured clinical note sections.`,
      'USER_EDIT'
    );
  };

  const handleCancelEdits = () => {
    setEditedNote(note);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-xs text-slate-800">
            Structured Clinical Note (SOAP)
          </h3>
          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
            Human-in-the-Loop Review
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={onRegenerateNote}
                disabled={isGeneratingNote}
                className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                title="Regenerate from transcript"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{isGeneratingNote ? "Generating..." : "Regenerate"}</span>
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Note</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancelEdits}
                className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSaveEdits}
                className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Citations Grounding Bar */}
      {note.citations && note.citations.length > 0 && (
        <div className="px-4 py-2 bg-blue-50/50 border-b border-blue-100 flex items-center space-x-2 text-[11px] overflow-x-auto">
          <span className="font-bold text-blue-800 flex items-center gap-1 shrink-0">
            <Tag className="w-3 h-3 text-blue-600" />
            Source Grounding:
          </span>
          {note.citations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCitation(selectedCitation === c.id ? null : c.id)}
              className={`px-2 py-0.5 rounded-full border transition shrink-0 ${
                selectedCitation === c.id
                  ? 'bg-blue-600 text-white border-blue-700 font-bold'
                  : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100/60 font-medium'
              }`}
            >
              [{c.mappedSection.toUpperCase()}]: "{c.quote.slice(0, 24)}..."
            </button>
          ))}
        </div>
      )}

      {/* Selected Citation Banner */}
      {selectedCitation && (
        <div className="px-4 py-2 bg-blue-100/80 border-b border-blue-200 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold">Transcript Evidence:</span>
            <span className="italic">
              "{note.citations?.find(c => c.id === selectedCitation)?.quote}"
            </span>
          </div>
          <button
            onClick={() => setSelectedCitation(null)}
            className="text-xs text-blue-700 font-bold hover:text-blue-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* SOAP Content Body */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
        {/* Subjective */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-800 tracking-wide">S — SUBJECTIVE</span>
            <span className="text-[10px] text-slate-400">Chief complaint & patient history</span>
          </div>
          <div className="p-3">
            {isEditing ? (
              <textarea
                value={editedNote.subjective}
                onChange={(e) => setEditedNote({ ...editedNote, subjective: e.target.value })}
                rows={4}
                className="w-full text-xs p-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal leading-relaxed text-slate-900"
              />
            ) : (
              <p className="text-slate-800 leading-relaxed whitespace-pre-line">{note.subjective}</p>
            )}
          </div>
        </div>

        {/* Objective */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-800 tracking-wide">O — OBJECTIVE</span>
            <span className="text-[10px] text-slate-400">Vitals, physical exam & findings</span>
          </div>
          <div className="p-3">
            {isEditing ? (
              <textarea
                value={editedNote.objective}
                onChange={(e) => setEditedNote({ ...editedNote, objective: e.target.value })}
                rows={5}
                className="w-full text-xs p-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal leading-relaxed text-slate-900"
              />
            ) : (
              <p className="text-slate-800 leading-relaxed whitespace-pre-line">{note.objective}</p>
            )}
          </div>
        </div>

        {/* Assessment */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-800 tracking-wide">A — ASSESSMENT</span>
            <span className="text-[10px] text-slate-400">Clinical reasoning & diagnoses</span>
          </div>
          <div className="p-3">
            {isEditing ? (
              <textarea
                value={editedNote.assessment}
                onChange={(e) => setEditedNote({ ...editedNote, assessment: e.target.value })}
                rows={4}
                className="w-full text-xs p-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal leading-relaxed text-slate-900"
              />
            ) : (
              <p className="text-slate-800 leading-relaxed whitespace-pre-line">{note.assessment}</p>
            )}
          </div>
        </div>

        {/* Plan */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-800 tracking-wide">P — PLAN</span>
            <span className="text-[10px] text-slate-400">Diagnostics, Rx, referrals & education</span>
          </div>
          <div className="p-3">
            {isEditing ? (
              <textarea
                value={editedNote.plan}
                onChange={(e) => setEditedNote({ ...editedNote, plan: e.target.value })}
                rows={5}
                className="w-full text-xs p-2 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal leading-relaxed text-slate-900"
              />
            ) : (
              <p className="text-slate-800 leading-relaxed whitespace-pre-line">{note.plan}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
