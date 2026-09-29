"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/common/Header";
import { PatientSummaryCard } from "@/components/patient-context/PatientSummaryCard";
import { AudioRecorder } from "@/components/encounter/AudioRecorder";
import { TranscriptViewer } from "@/components/encounter/TranscriptViewer";
import { SoapNoteEditor } from "@/components/documentation/SoapNoteEditor";
import { ActionExtractorTable } from "@/components/actions/ActionExtractorTable";
import { DocumentGeneratorModal } from "@/components/documents/DocumentGeneratorModal";
import { AuditTrailDrawer } from "@/components/audit/AuditTrailDrawer";
import { SYNTHETIC_PATIENTS } from "@/lib/data/synthetic-patients";
import { SAMPLE_CONSULTATIONS, ConsultationPreset } from "@/lib/data/sample-consultations";
import { aiOrchestrator } from "@/lib/ai/orchestrator";
import { Patient, SoapNote, ActionItem, GeneratedDocument, AuditEntry, ActionStatus, Encounter } from "@/types/clinical";
import { saveEncounterToFirestore, logAuditToFirestore } from "@/lib/firebase/firestore";
import { FileText, CheckCircle2, RotateCcw, Sparkles, Cloud } from "lucide-react";

export default function ClinicalWorkbenchPage() {
  // Patients & Selection
  const [patients] = useState<Patient[]>(SYNTHETIC_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<Patient>(SYNTHETIC_PATIENTS[0]);

  // Consultation & Audio
  const [selectedPreset, setSelectedPreset] = useState<ConsultationPreset>(SAMPLE_CONSULTATIONS[0]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);

  // Transcript Turns
  const [turns, setTurns] = useState(selectedPreset.dialogue);

  // Clinical Note
  const [note, setNote] = useState<SoapNote>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    summary: "",
    citations: []
  });

  // Actions & Documents
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Audit Trail & Status
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [encounterStatus, setEncounterStatus] = useState<'DRAFT' | 'IN_REVIEW' | 'APPROVED'>('DRAFT');
  const [providerName, setProviderName] = useState(aiOrchestrator.getProviderName());

  // Log an audit trail entry
  const logAudit = (
    action: string,
    details: string,
    category: 'AI_GENERATION' | 'USER_EDIT' | 'ACTION_DECISION' | 'APPROVAL' | 'QUERY'
  ) => {
    const newEntry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      actor: "Dr. Alexander Thorne, MD",
      action,
      details,
      category,
    };
    setAuditEntries((prev) => [newEntry, ...prev]);
    // Persist to Cloud Firestore
    logAuditToFirestore(newEntry);
  };

  // Initial setup when switching patient
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    // Find matching preset if available
    const matched = SAMPLE_CONSULTATIONS.find(c => c.patientId === patient.id) || SAMPLE_CONSULTATIONS[0];
    setSelectedPreset(matched);
    setTurns(matched.dialogue);
    setNote({
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
      summary: "",
      citations: []
    });
    setActions([]);
    setDocuments([]);
    setEncounterStatus('DRAFT');
    logAudit("Patient Switched", `Switched active chart to ${patient.firstName} ${patient.lastName} (MRN: ${patient.mrn})`, 'QUERY');
  };

  // Switch AI Provider
  const handleSetProvider = (type: 'mock' | 'gemini', apiKey?: string) => {
    aiOrchestrator.setProviderType(type, apiKey);
    setProviderName(aiOrchestrator.getProviderName());
    logAudit("AI Provider Updated", `Switched active orchestration provider to: ${aiOrchestrator.getProviderName()}`, 'USER_EDIT');
  };

  // Transcribe & Process Encounter Pipeline
  const handleStartTranscription = async (textOrAudio: string | Blob) => {
    setIsTranscribing(true);
    try {
      const provider = aiOrchestrator.getProvider();
      
      let transcriptText = "";
      if (typeof textOrAudio === 'string') {
        transcriptText = textOrAudio;
      } else {
        const transRes = await provider.transcribeAudio(textOrAudio);
        transcriptText = transRes.transcriptText;
        setTurns(transRes.turns);
      }

      logAudit("Encounter Transcribed", `Medical transcription generated (${turns.length} dialogue turns).`, 'AI_GENERATION');

      // Immediately run clinical note generation and action extraction
      setIsGeneratingNote(true);
      const generatedNote = await provider.generateClinicalNote(selectedPatient, transcriptText);
      setNote(generatedNote);
      logAudit("SOAP Note Generated", `AI drafted initial clinical note with ${generatedNote.citations?.length || 0} citations.`, 'AI_GENERATION');

      const extractedActions = await provider.extractActions(selectedPatient, transcriptText, generatedNote);
      setActions(extractedActions);
      logAudit("Actions Extracted", `Identified ${extractedActions.length} downstream actions/orders for review.`, 'AI_GENERATION');

      setEncounterStatus('IN_REVIEW');
    } catch (err) {
      console.error("Pipeline failure:", err);
    } finally {
      setIsTranscribing(false);
      setIsGeneratingNote(false);
    }
  };

  // Regenerate note only
  const handleRegenerateNote = async () => {
    setIsGeneratingNote(true);
    try {
      const provider = aiOrchestrator.getProvider();
      const rawText = turns.map(t => `${t.speaker}: ${t.text}`).join("\n");
      const generated = await provider.generateClinicalNote(selectedPatient, rawText);
      setNote(generated);
      logAudit("SOAP Note Re-analyzed", "Clinician requested re-generation of note from active transcript.", 'AI_GENERATION');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingNote(false);
    }
  };

  // Update transcript turn
  const handleUpdateTurn = (index: number, newText: string) => {
    setTurns(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text: newText };
      return updated;
    });
  };

  // Update action decision status (ACCEPTED / REJECTED)
  const handleUpdateActionStatus = (id: string, status: ActionStatus) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const handleModifyAction = (updated: ActionItem) => {
    setActions(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const handleAddAction = (newAction: ActionItem) => {
    setActions(prev => [newAction, ...prev]);
  };

  const handleApproveEncounter = async () => {
    if (!note.subjective && !note.plan) {
      alert("Please process or generate a clinical note before approving.");
      return;
    }

    setEncounterStatus('APPROVED');
    const finalActions = actions.map(a => a.status === 'SUGGESTED' ? { ...a, status: 'ACCEPTED' as ActionStatus } : a);
    setActions(finalActions);

    logAudit(
      "Encounter Formally Approved & Signed",
      `Attending Clinician (Dr. Alexander Thorne, MD) verified, edited, and approved the final SOAP note and downstream actions. Encounter committed to structured record.`,
      'APPROVAL'
    );

    // Save full clinical encounter to Cloud Firestore
    const encounterData: Encounter = {
      id: `enc-${Date.now()}`,
      patientId: selectedPatient.id,
      date: new Date().toISOString().split('T')[0],
      clinician: "Dr. Alexander Thorne, MD",
      encounterType: selectedPreset.encounterType,
      transcript: turns,
      rawTranscriptText: turns.map(t => `${t.speaker}: ${t.text}`).join('\n'),
      clinicalNote: note,
      actions: finalActions,
      documents: documents,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: "Dr. Alexander Thorne, MD",
      auditTrail: auditEntries,
    };
    await saveEncounterToFirestore(encounterData);
  };

  const handleResetEncounter = () => {
    if (confirm("Reset current encounter back to draft?")) {
      setNote({
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
        summary: "",
        citations: []
      });
      setActions([]);
      setDocuments([]);
      setEncounterStatus('DRAFT');
      logAudit("Encounter Reset", "Clinician reset encounter draft to initial state.", 'USER_EDIT');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Application Bar */}
      <Header
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={handleSelectPatient}
        providerName={providerName}
        onSetProvider={handleSetProvider}
        auditCount={auditEntries.length}
        onOpenAudit={() => setIsAuditOpen(true)}
        encounterStatus={encounterStatus}
      />

      {/* Main Clinical Workbench Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          {/* Column 1: Patient Context & Longitudinal Record Q&A (4 cols) */}
          <div className="lg:col-span-4 h-[calc(100vh-10rem)] sticky top-20">
            <PatientSummaryCard
              patient={selectedPatient}
              onLogAudit={logAudit}
            />
          </div>

          {/* Column 2 & 3: Encounter Audio/Transcript & Clinical Note/Actions (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Audio Recording & Scenario Ingestion Box */}
            <AudioRecorder
              presets={SAMPLE_CONSULTATIONS.filter(c => c.patientId === selectedPatient.id).length > 0 
                ? SAMPLE_CONSULTATIONS.filter(c => c.patientId === selectedPatient.id) 
                : SAMPLE_CONSULTATIONS}
              selectedPresetId={selectedPreset.id}
              onSelectPreset={(p) => {
                setSelectedPreset(p);
                setTurns(p.dialogue);
                logAudit("Preset Loaded", `Loaded scenario fixture: ${p.title}`, 'AI_GENERATION');
              }}
              onStartTranscription={handleStartTranscription}
              isTranscribing={isTranscribing}
              onLogAudit={logAudit}
            />

            {/* Split Row: Transcript Viewer (left) and SOAP Note Editor (right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-[520px]">
              {/* Transcript Pane */}
              <TranscriptViewer
                turns={turns}
                onUpdateTurn={handleUpdateTurn}
                onLogAudit={logAudit}
              />

              {/* SOAP Note Pane */}
              <SoapNoteEditor
                note={note}
                onUpdateNote={setNote}
                onLogAudit={logAudit}
                isGeneratingNote={isGeneratingNote}
                onRegenerateNote={handleRegenerateNote}
              />
            </div>

            {/* Downstream Clinical Actions & Orders Table */}
            <div className="h-[420px]">
              <ActionExtractorTable
                actions={actions}
                onUpdateActionStatus={handleUpdateActionStatus}
                onModifyAction={handleModifyAction}
                onAddAction={handleAddAction}
                onLogAudit={logAudit}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Clinician Sign-Off Dock */}
      <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            <span className="font-semibold text-slate-700">Encounter Workflow:</span>
            <span className="text-slate-500">
              {note.summary ? "SOAP Note Generated" : "Awaiting Transcription"}
            </span>
            <span>•</span>
            <span className="text-slate-500">
              {actions.filter(a => a.status === 'ACCEPTED').length} / {actions.length} Actions Accepted
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetEncounter}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={() => setIsDocModalOpen(true)}
              disabled={!note.subjective && !note.plan}
              className="text-xs px-3.5 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Draft Documents ({documents.length})</span>
            </button>

            {encounterStatus === 'APPROVED' ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-lg border border-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Encounter Formally Signed & Committed</span>
              </div>
            ) : (
              <button
                onClick={handleApproveEncounter}
                disabled={!note.subjective && !note.plan}
                className="text-xs px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Sign Encounter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Generator Modal */}
      <DocumentGeneratorModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        patient={selectedPatient}
        note={note}
        actions={actions}
        documents={documents}
        onAddDocument={(doc) => setDocuments(prev => [doc, ...prev])}
        onApproveDocument={(id) => setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'APPROVED', approvedAt: new Date().toISOString() } : d))}
        onLogAudit={logAudit}
      />

      {/* Audit Trail Drawer */}
      <AuditTrailDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        entries={auditEntries}
      />
    </div>
  );
}
