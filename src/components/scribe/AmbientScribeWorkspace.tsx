"use client";

import React, { useState } from "react";
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  ShieldCheck,
  Clock,
  User,
  ArrowRight,
  Stethoscope,
  Copy,
  Pill,
  TestTube2,
  Calendar,
  Layers,
  Send,
  Lock
} from "lucide-react";
import { useHospital } from "@/lib/state/hospital-store";
import { SAMPLE_CONSULTATIONS, ConsultationPreset } from "@/lib/data/sample-consultations";
import { aiOrchestrator } from "@/lib/ai/orchestrator";
import { ActionItem, SoapNote } from "@/types/clinical";
import { ClinicalNote, OrderType, OrderPriority } from "@/types/hospital";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const AmbientScribeWorkspace: React.FC = () => {
  const {
    activePatient,
    activeEncounter,
    currentStaff,
    saveClinicalNote,
    signClinicalNote,
    createCPOEOrder,
    notes
  } = useHospital();

  const [selectedPreset, setSelectedPreset] = useState<ConsultationPreset>(SAMPLE_CONSULTATIONS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePlaybackIndex, setActivePlaybackIndex] = useState<number>(-1);
  const [isSimulatingStream, setIsSimulatingStream] = useState(false);

  // Drafted SOAP sections
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [activeTab, setActiveTab] = useState<'soap' | 'actions' | 'notesHistory'>('soap');

  // Proposed Action Items from AI Plan
  const [proposedActions, setProposedActions] = useState<ActionItem[]>([]);
  const [acceptedActionIds, setAcceptedActionIds] = useState<Set<string>>(new Set());

  // Active Draft Note ID in EHR
  const [currentDraftNoteId, setCurrentDraftNoteId] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [signedTimestamp, setSignedTimestamp] = useState<string | null>(null);

  // Step 1: Simulate Real-time Streaming Transcript Dialogue
  const handleSimulatePlayback = () => {
    setIsSimulatingStream(true);
    setActivePlaybackIndex(0);

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < selectedPreset.dialogue.length) {
        setActivePlaybackIndex(idx);
      } else {
        clearInterval(interval);
        setIsSimulatingStream(false);
        setActivePlaybackIndex(selectedPreset.dialogue.length - 1);
      }
    }, 450);
  };

  // Step 2: Run Deterministic AI Scribe Extraction
  const handleProcessDialogue = async () => {
    setIsProcessing(true);
    try {
      const provider = aiOrchestrator.getProvider();
      const rawText = selectedPreset.dialogue.map(t => `${t.speaker}: ${t.text}`).join("\n");

      const generatedNote = await provider.generateClinicalNote(activePatient as any, rawText);
      setSubjective(generatedNote.subjective);
      setObjective(generatedNote.objective);
      setAssessment(generatedNote.assessment);
      setPlan(generatedNote.plan);

      const extracted = await provider.extractActions(activePatient as any, rawText, generatedNote);
      setProposedActions(extracted);
      setAcceptedActionIds(new Set());
      setIsSigned(false);
      setSignedTimestamp(null);

      // Auto-save initial draft note in Hospital Repository
      const saved = saveClinicalNote({
        encounterId: activeEncounter.id,
        patientId: activePatient.id,
        authorId: currentStaff.id,
        noteType: 'SOAP_ENCOUNTER',
        status: 'DRAFT',
        subjective: { text: generatedNote.subjective },
        objective: { text: generatedNote.objective },
        assessment: { text: generatedNote.assessment },
        plan: { text: generatedNote.plan }
      });
      setCurrentDraftNoteId(saved.id);
    } catch (err) {
      console.error("Ambient Scribe processing error:", err);
      alert("Failed to synthesize clinical dialogue.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3: Accept Action Item & Convert Directly into CPOE Order
  const handleAcceptActionItem = (action: ActionItem) => {
    if (acceptedActionIds.has(action.id)) return;

    let orderType: OrderType = 'MEDICATION';
    let priority: OrderPriority = action.urgency === 'URGENT' ? 'URGENT' : 'ROUTINE';

    if (action.type === 'LAB_ORDER') orderType = 'LAB';
    else if (action.type === 'REFERRAL') orderType = 'CONSULT';
    else if (action.type === 'PATIENT_INSTRUCTION') orderType = 'NURSING';
    else if (action.type === 'FOLLOW_UP') orderType = 'CONSULT';

    createCPOEOrder({
      encounterId: activeEncounter.id,
      patientId: activePatient.id,
      orderType,
      priority,
      title: action.title,
      description: `${action.description} [Origin: Ambient AI Plan Extraction - ${action.rationale}]`
    });

    setAcceptedActionIds(prev => new Set(prev).add(action.id));
  };

  // Step 4: Electronic Attestation & Legal Note Signing
  const handleAttestAndSign = () => {
    if (!subjective.trim() || !plan.trim()) {
      alert("Cannot sign empty SOAP note. Please process dialogue first.");
      return;
    }

    let noteIdToSign = currentDraftNoteId;
    if (!noteIdToSign) {
      const saved = saveClinicalNote({
        encounterId: activeEncounter.id,
        patientId: activePatient.id,
        authorId: currentStaff.id,
        noteType: 'SOAP_ENCOUNTER',
        status: 'DRAFT',
        subjective: { text: subjective },
        objective: { text: objective },
        assessment: { text: assessment },
        plan: { text: plan }
      });
      noteIdToSign = saved.id;
      setCurrentDraftNoteId(saved.id);
    }

    const signed = signClinicalNote(noteIdToSign);
    setIsSigned(true);
    setSignedTimestamp(signed.signedAt || new Date().toISOString());
  };

  const patientNotes = notes.filter(n => n.patientId === activePatient.id);

  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner / Preset Selection Bar */}
      <div className="bg-white p-3.5 rounded-bji border border-[#D7DEE7] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-bji bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Ambient AI Clinical Scribe &amp; SOAP Documentation
              </h2>
              <Badge variant="emerald" size="sm">Evidence Grounded</Badge>
            </div>
            <p className="text-[11px] text-slate-500">
              Active Patient: <strong className="text-slate-800">{activePatient.lastName}, {activePatient.firstName}</strong> (MRN: {activePatient.mrn}) • Attending: {currentStaff.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPreset.id}
            onChange={(e) => {
              const found = SAMPLE_CONSULTATIONS.find(c => c.id === e.target.value);
              if (found) {
                setSelectedPreset(found);
                setActivePlaybackIndex(-1);
                setSubjective("");
                setObjective("");
                setAssessment("");
                setPlan("");
                setProposedActions([]);
                setIsSigned(false);
                setSignedTimestamp(null);
                setCurrentDraftNoteId(null);
              }
            }}
            className="bg-white border border-[#D7DEE7] text-xs rounded-bji px-2.5 py-1.5 font-medium outline-none text-slate-800"
          >
            {SAMPLE_CONSULTATIONS.map(p => (
              <option key={p.id} value={p.id}>{p.title} ({p.audioDurationSeconds}s)</option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulatePlayback}
            disabled={isSimulatingStream}
            className="gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-blue-600" />
            <span>{isSimulatingStream ? "Playing..." : "Simulate Audio"}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleProcessDialogue}
            disabled={isProcessing}
            className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 border-emerald-800"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProcessing ? "Synthesizing Note..." : "Process Dialogue"}</span>
          </Button>
        </div>
      </div>

      {/* Main Split Grid: Live Transcript vs Structured Note Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Col (5 cols): Multi-Speaker Diarized Transcript */}
        <div className="lg:col-span-5 bg-white rounded-bji border border-[#D7DEE7] flex flex-col h-[600px] overflow-hidden">
          <div className="p-3 border-b border-[#E7ECF3] bg-[#F8FAFC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Multi-Speaker Audio Transcript
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {selectedPreset.dialogue.length} dialogue turns
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {selectedPreset.dialogue.map((turn, idx) => {
              const isClinician = turn.speaker === 'Clinician';
              const isCurrentlyPlaying = idx === activePlaybackIndex;
              const hasPlayed = activePlaybackIndex >= idx || activePlaybackIndex === -1;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-bji border transition-all ${
                    isCurrentlyPlaying
                      ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400'
                      : isClinician
                      ? 'bg-slate-50/80 border-slate-200'
                      : 'bg-emerald-50/40 border-emerald-200/60'
                  } ${!hasPlayed && activePlaybackIndex !== -1 ? 'opacity-40' : 'opacity-100'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                        isClinician ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {turn.speaker}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{turn.timestamp}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-sans text-[11.5px]">{turn.text}</p>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-[#E7ECF3] text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>Audio: {selectedPreset.audioDurationSeconds}s (Sampled 16kHz)</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Diarization Complete
            </span>
          </div>
        </div>

        {/* Right Col (7 cols): SOAP Note & Action Extraction Workspace */}
        <div className="lg:col-span-7 bg-white rounded-bji border border-[#D7DEE7] flex flex-col h-[600px] overflow-hidden">
          {/* Header Tabs */}
          <div className="p-2 border-b border-[#E7ECF3] bg-[#F8FAFC] flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('soap')}
                className={`px-3 py-1.5 text-xs font-bold rounded-bji transition ${
                  activeTab === 'soap'
                    ? 'bg-white text-slate-900 border border-[#D7DEE7] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Structured SOAP Note
              </button>
              <button
                onClick={() => setActiveTab('actions')}
                className={`px-3 py-1.5 text-xs font-bold rounded-bji transition flex items-center gap-1.5 ${
                  activeTab === 'actions'
                    ? 'bg-white text-slate-900 border border-[#D7DEE7] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Draft-to-CPOE Orders</span>
                {proposedActions.length > 0 && (
                  <Badge variant="blue" size="sm">{proposedActions.length}</Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab('notesHistory')}
                className={`px-3 py-1.5 text-xs font-bold rounded-bji transition flex items-center gap-1.5 ${
                  activeTab === 'notesHistory'
                    ? 'bg-white text-slate-900 border border-[#D7DEE7] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Encounter History</span>
                <Badge variant="neutral" size="sm">{patientNotes.length}</Badge>
              </button>
            </div>

            {isSigned ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Legally Signed &amp; Locked
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">
                {currentDraftNoteId ? "Draft Saved" : "Awaiting Synthesis"}
              </span>
            )}
          </div>

          {/* TAB 1: SOAP NOTE EDITABLE & ATTESTATION */}
          {activeTab === 'soap' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {/* Subjective */}
              <div className="border border-[#D7DEE7] rounded-bji p-3 bg-white space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                    S — Subjective History &amp; Chief Complaint
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">ICD-10 Mapped</span>
                </div>
                <textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  disabled={isSigned}
                  rows={3}
                  placeholder="Click 'Process Dialogue' above to automatically extract subjective history..."
                  className="w-full text-slate-800 text-xs bg-slate-50/50 border border-slate-200 rounded p-2 outline-none focus:bg-white focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>

              {/* Objective */}
              <div className="border border-[#D7DEE7] rounded-bji p-3 bg-white space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                    O — Objective Examination &amp; Vitals
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">Physical Exam / Labs</span>
                </div>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  disabled={isSigned}
                  rows={3}
                  placeholder="Objective vitals, auscultation, and physical examination findings..."
                  className="w-full text-slate-800 text-xs bg-slate-50/50 border border-slate-200 rounded p-2 outline-none focus:bg-white focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>

              {/* Assessment */}
              <div className="border border-[#D7DEE7] rounded-bji p-3 bg-white space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    A — Clinical Assessment &amp; Differential
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">Clinical Reasoning</span>
                </div>
                <textarea
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  disabled={isSigned}
                  rows={3}
                  placeholder="Numbered assessment with problem list and clinical acuity..."
                  className="w-full text-slate-800 text-xs bg-slate-50/50 border border-slate-200 rounded p-2 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>

              {/* Plan */}
              <div className="border border-[#D7DEE7] rounded-bji p-3 bg-white space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    P — Treatment Plan, Orders &amp; Follow-up
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">Downstream Actions</span>
                </div>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  disabled={isSigned}
                  rows={3}
                  placeholder="Actionable plan: diagnostic tests, prescriptions, specialist consults..."
                  className="w-full text-slate-800 text-xs bg-slate-50/50 border border-slate-200 rounded p-2 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
            </div>
          )}

          {/* TAB 2: DRAFT-TO-CPOE ACTIONS CONVERTER */}
          {activeTab === 'actions' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div className="p-2.5 bg-blue-50/80 rounded-bji border border-blue-200 text-blue-900 leading-tight">
                <strong>Ambient Clinical Decision Extraction:</strong> The following actionable orders and referrals were parsed from the generated Plan. Click <strong>Accept &amp; Transmit to CPOE</strong> to place each order with 1 click.
              </div>

              {proposedActions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No downstream orders extracted yet. Process a dialogue in the SOAP tab first.
                </div>
              ) : (
                proposedActions.map(action => {
                  const isAccepted = acceptedActionIds.has(action.id);
                  return (
                    <div
                      key={action.id}
                      className={`p-3 rounded-bji border transition flex items-start justify-between gap-3 ${
                        isAccepted
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-white border-[#D7DEE7] hover:border-slate-400'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{action.title}</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            action.type === 'LAB_ORDER' ? 'bg-purple-100 text-purple-800' :
                            action.type === 'REFERRAL' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {action.type.replace('_', ' ')}
                          </span>
                          <Badge variant={action.urgency === 'URGENT' ? 'amber' : 'neutral'} size="sm">
                            {action.urgency}
                          </Badge>
                        </div>
                        <p className="text-slate-600 text-[11px]">{action.description}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Target: {action.recipientOrTarget} • Rationale: {action.rationale}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isAccepted ? (
                          <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Transmitted
                          </span>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptActionItem(action)}
                            className="bg-blue-600 hover:bg-blue-700 text-xs"
                          >
                            Accept &amp; Order
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: CLINICAL NOTES HISTORY & AUDIT TRAIL */}
          {activeTab === 'notesHistory' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Longitudinal Signed Notes for {activePatient.lastName}, {activePatient.firstName} ({patientNotes.length})
              </span>

              {patientNotes.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No notes documented yet.</div>
              ) : (
                patientNotes.map(n => (
                  <div key={n.id} className="border border-[#D7DEE7] rounded-bji p-3 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-slate-900">{n.noteType} (v{n.version})</span>
                        <Badge variant={n.status === 'SIGNED' ? 'emerald' : 'amber'} size="sm">
                          {n.status}
                        </Badge>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded text-[11px] text-slate-700 line-clamp-3">
                      <strong>Assessment:</strong> {n.assessment.text}
                    </div>

                    {n.signedAt && (
                      <div className="text-[10px] font-mono text-emerald-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Signed by {n.signedBy} at {new Date(n.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer Bar: Electronic Attestation & Commit */}
          <div className="p-3 bg-slate-50 border-t border-[#E7ECF3] flex items-center justify-between">
            <div className="text-[11px] font-mono text-slate-500">
              {isSigned ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Attested by {currentStaff.name} ({currentStaff.role}) at {new Date(signedTimestamp || '').toLocaleTimeString()}</span>
                </span>
              ) : (
                <span>Author: {currentStaff.name} ({currentStaff.role})</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isSigned ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAttestAndSign}
                  disabled={!subjective.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 border-emerald-800 gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Formally Attest &amp; Sign Note</span>
                </Button>
              ) : (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Permanent EHR Record Locked
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
