"use client";

import React, { useState } from "react";
import { Patient, SoapNote, ActionItem, GeneratedDocument, ActionStatus, Encounter } from "@/types/clinical";
import { ConsultationPreset } from "@/lib/data/sample-consultations";
import { aiOrchestrator } from "@/lib/ai/orchestrator";
import { saveEncounterToFirestore } from "@/lib/firebase/firestore";
import { 
  Mic, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Edit3, 
  Save, 
  Stethoscope, 
  User, 
  ArrowRight, 
  ShieldAlert, 
  Tag, 
  X,
  Plus,
  Share2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { DocumentGeneratorModal } from "@/components/documents/DocumentGeneratorModal";

interface EncounterStudioProps {
  patient: Patient;
  preset: ConsultationPreset;
  presets: ConsultationPreset[];
  onSelectPreset: (preset: ConsultationPreset) => void;
  onLogAudit: (action: string, details: string, category: 'AI_GENERATION' | 'USER_EDIT' | 'ACTION_DECISION' | 'APPROVAL' | 'QUERY') => void;
}

export const EncounterStudio: React.FC<EncounterStudioProps> = ({
  patient,
  preset,
  presets,
  onSelectPreset,
  onLogAudit,
}) => {
  const [turns, setTurns] = useState(preset.dialogue);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);

  // SOAP Note State
  const [note, setNote] = useState<SoapNote>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    summary: "",
    citations: []
  });
  const [editedNote, setEditedNote] = useState<SoapNote>(note);

  // Actions & Documents
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [encounterStatus, setEncounterStatus] = useState<'DRAFT' | 'IN_REVIEW' | 'APPROVED'>('DRAFT');

  // Sync edited note when not editing
  React.useEffect(() => {
    if (!isEditingNote) setEditedNote(note);
  }, [note, isEditingNote]);

  // Handle Preset Change
  const handlePresetSelect = (p: ConsultationPreset) => {
    onSelectPreset(p);
    setTurns(p.dialogue);
    setNote({ subjective: "", objective: "", assessment: "", plan: "", summary: "", citations: [] });
    setActions([]);
    setDocuments([]);
    setEncounterStatus('DRAFT');
    onLogAudit("Preset Scenario Loaded", `Loaded clinical fixture: ${p.title}`, 'AI_GENERATION');
  };

  // Run Auto Pipeline
  const handleProcessEncounter = async () => {
    setIsTranscribing(true);
    try {
      const provider = aiOrchestrator.getProvider();
      const rawText = turns.map(t => `${t.speaker} [${t.timestamp}]: ${t.text}`).join("\n\n");
      onLogAudit("Consultation Audio Processed", `Transcribed ${turns.length} turns of clinical dialogue.`, 'AI_GENERATION');

      setIsGeneratingNote(true);
      const generatedNote = await provider.generateClinicalNote(patient, rawText);
      setNote(generatedNote);
      onLogAudit("Clinical SOAP Note Drafted", `AI synthesized note with ${generatedNote.citations?.length || 0} citations.`, 'AI_GENERATION');

      const extractedActions = await provider.extractActions(patient, rawText, generatedNote);
      setActions(extractedActions);
      onLogAudit("Clinical Orders Extracted", `Identified ${extractedActions.length} downstream actions.`, 'AI_GENERATION');

      setEncounterStatus('IN_REVIEW');
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranscribing(false);
      setIsGeneratingNote(false);
    }
  };

  const handleSaveNoteEdits = () => {
    setNote(editedNote);
    setIsEditingNote(false);
    onLogAudit("SOAP Note Modified", "Clinician edited note sections.", "USER_EDIT");
  };

  const handleActionStatus = (id: string, status: ActionStatus) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    onLogAudit(`Order ${status}`, `Action ID ${id} set to ${status}`, "ACTION_DECISION");
  };

  const handleApproveEncounter = async () => {
    if (!note.subjective && !note.plan) {
      alert("Please process an encounter or draft a note first.");
      return;
    }

    setEncounterStatus('APPROVED');
    const finalActions = actions.map(a => a.status === 'SUGGESTED' ? { ...a, status: 'ACCEPTED' as ActionStatus } : a);
    setActions(finalActions);

    const encounterRecord: Encounter = {
      id: `enc-${Date.now()}`,
      patientId: patient.id,
      date: new Date().toISOString().split('T')[0],
      clinician: "Dr. Alexander Thorne, MD",
      encounterType: preset.encounterType,
      transcript: turns,
      rawTranscriptText: turns.map(t => `${t.speaker}: ${t.text}`).join('\n'),
      clinicalNote: note,
      actions: finalActions,
      documents: documents,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: "Dr. Alexander Thorne, MD",
      auditTrail: []
    };

    await saveEncounterToFirestore(encounterRecord);
    onLogAudit("Encounter Approved & Committed", "Encounter signed and synchronized to Cloud Firestore.", "APPROVAL");
  };

  const allergies = patient.allergies || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Active Patient Summary Banner */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">{patient.firstName} {patient.lastName}</h2>
              <span className="text-xs text-slate-500 font-medium">
                ({patient.dob ? `${new Date().getFullYear() - new Date(patient.dob).getFullYear()}yo` : 'Age unknown'} {patient.gender})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              MRN: <span className="font-mono text-slate-700">{patient.mrn}</span> • Active Encounter
            </p>
          </div>
        </div>

        {/* Red Allergy Alert Badge */}
        {allergies.length > 0 && (
          <div className="px-3.5 py-2 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 self-start sm:self-center">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>Allergy Alert: {allergies.map(a => a.allergen).join(", ")} ({allergies[0].severity})</span>
          </div>
        )}
      </div>

      {/* Ambient Microphone Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center relative overflow-hidden">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-center">
            <button
              onClick={handleProcessEncounter}
              disabled={isTranscribing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition transform active:scale-95 shadow-lg ${
                isTranscribing
                  ? 'bg-emerald-500 text-white animate-pulse-ring'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
              }`}
            >
              <Mic className="w-9 h-9" />
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isTranscribing ? "Transcribing & Synthesizing Encounter..." : "Ambient AI Listener Ready"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isTranscribing 
                ? "Extracting clinical observations, grounded SOAP notes, and downstream orders..."
                : "Tap the microphone to process the consultation dialogue turns."
              }
            </p>
          </div>

          {/* Scenario Selector */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Scenario:</span>
            <select
              value={preset.id}
              onChange={(e) => {
                const found = presets.find(p => p.id === e.target.value);
                if (found) handlePresetSelect(found);
              }}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {presets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.dialogue.length} turns)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Collapsible Encounter Transcript Drawer */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900">Encounter Dialogue Transcript</span>
              <span className="text-xs text-slate-400 ml-2">({turns.length} turns)</span>
            </div>
          </div>
          {showTranscript ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showTranscript && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3 max-h-96 overflow-y-auto">
            {turns.map((turn, idx) => {
              const isDoctor = turn.speaker === 'Clinician';
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                    isDoctor
                      ? 'bg-blue-50/80 border-blue-100 text-blue-950'
                      : 'bg-white border-slate-200/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
                      isDoctor ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isDoctor ? <Stethoscope className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {turn.speaker}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{turn.timestamp}</span>
                  </div>
                  <p>{turn.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clinical SOAP Note Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Clinical SOAP Note</h3>
              <p className="text-[11px] text-slate-400">Synthesized with verbatim citation links</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isEditingNote ? (
              <button
                onClick={() => setIsEditingNote(true)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Note</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsEditingNote(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNoteEdits}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Citations Chips Bar */}
        {note.citations && note.citations.length > 0 && (
          <div className="py-2 flex items-center space-x-2 text-xs overflow-x-auto border-b border-slate-100">
            <span className="text-emerald-700 font-bold flex items-center gap-1 shrink-0">
              <Tag className="w-3.5 h-3.5" /> Citations:
            </span>
            {note.citations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCitation(selectedCitation === c.id ? null : c.id)}
                className={`px-2.5 py-1 rounded-full border text-[11px] transition shrink-0 ${
                  selectedCitation === c.id
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                [{c.mappedSection.toUpperCase()}]: "{c.quote.slice(0, 24)}..."
              </button>
            ))}
          </div>
        )}

        {/* SOAP Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subjective */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
              S — Subjective
            </span>
            {isEditingNote ? (
              <textarea
                value={editedNote.subjective}
                onChange={(e) => setEditedNote({ ...editedNote, subjective: e.target.value })}
                rows={3}
                className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {note.subjective || "Tap the microphone above to draft the subjective history."}
              </p>
            )}
          </div>

          {/* Objective */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
              O — Objective
            </span>
            {isEditingNote ? (
              <textarea
                value={editedNote.objective}
                onChange={(e) => setEditedNote({ ...editedNote, objective: e.target.value })}
                rows={3}
                className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {note.objective || "Vitals, physical examination, and sensory tests will appear here."}
              </p>
            )}
          </div>

          {/* Assessment */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
              A — Assessment
            </span>
            {isEditingNote ? (
              <textarea
                value={editedNote.assessment}
                onChange={(e) => setEditedNote({ ...editedNote, assessment: e.target.value })}
                rows={3}
                className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {note.assessment || "Clinical assessment, working diagnosis, and glycemic control status."}
              </p>
            )}
          </div>

          {/* Plan */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
              P — Plan
            </span>
            {isEditingNote ? (
              <textarea
                value={editedNote.plan}
                onChange={(e) => setEditedNote({ ...editedNote, plan: e.target.value })}
                rows={3}
                className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {note.plan || "Diagnostic testing, medication titration, and follow-up intervals."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Downstream Clinical Actions Strip */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Downstream Clinical Orders &amp; Actions ({actions.length})
            </h3>
            <p className="text-xs text-slate-500">Extracted orders from consultation. Accept, modify, or dismiss with 1 tap.</p>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {actions.filter(a => a.status === 'ACCEPTED').length} Accepted
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
          {actions.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-slate-400 text-xs">
              No orders extracted yet. Tap the microphone above to synthesize encounter.
            </div>
          ) : (
            actions.map((act) => (
              <div
                key={act.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                  act.status === 'ACCEPTED'
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : act.status === 'REJECTED'
                    ? 'bg-slate-50 border-slate-200 opacity-50 line-through'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-blue-700 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                      {act.type.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      act.urgency === 'URGENT' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {act.urgency}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 mt-1">{act.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{act.description}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400">
                    {act.status}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleActionStatus(act.id, 'REJECTED')}
                      className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium transition"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleActionStatus(act.id, 'ACCEPTED')}
                      className="px-3 py-1 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Bottom Action Dock */}
      <div className="sticky bottom-16 sm:bottom-4 z-20 bg-white/95 backdrop-blur-lg border border-slate-200 py-3.5 px-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-900">{patient.firstName} {patient.lastName}</span>
          <span>•</span>
          <span>Dr. Alexander Thorne, MD</span>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsDocModalOpen(true)}
            disabled={!note.subjective && !note.plan}
            className="px-4 py-2.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Referral Docs</span>
          </button>

          {encounterStatus === 'APPROVED' ? (
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Signed &amp; Saved to Cloud</span>
            </div>
          ) : (
            <button
              onClick={handleApproveEncounter}
              disabled={!note.subjective && !note.plan}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/15 transition flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve &amp; Commit</span>
            </button>
          )}
        </div>
      </div>

      {/* Document Generator Modal */}
      <DocumentGeneratorModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        patient={patient}
        note={note}
        actions={actions}
        documents={documents}
        onAddDocument={(doc) => setDocuments(prev => [doc, ...prev])}
        onApproveDocument={(id) => setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'APPROVED' } : d))}
        onLogAudit={onLogAudit}
      />
    </div>
  );
};
