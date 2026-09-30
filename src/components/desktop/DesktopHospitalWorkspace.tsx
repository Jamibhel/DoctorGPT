"use client";

import React, { useState, useMemo } from "react";
import { 
  Building2, 
  BedDouble, 
  Activity, 
  Pill, 
  FileText, 
  Clock, 
  ShieldAlert, 
  AlertCircle, 
  Sparkles, 
  Plus, 
  UserCheck, 
  ArrowRightLeft, 
  LogOut, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Radio, 
  Stethoscope, 
  Users, 
  Layers,
  TrendingUp,
  Share2,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Filter,
  Microscope,
  FileCheck2,
  Syringe,
  HeartPulse,
  Flame,
  LayoutGrid,
  ListOrdered
} from "lucide-react";
import { useHospital } from "@/lib/state/hospital-store";
import { UserRole, OrderType, VitalSignObservation, DiagnosticLabResult } from "@/types/hospital";
import { PacsStyleViewerModal } from "../imaging/PacsStyleViewerModal";
import { CpoeOrderModal } from "../cpoe/CpoeOrderModal";
import { AdtModal } from "../adt/AdtModal";
import { PatientTimelineView } from "../timeline/PatientTimelineView";
import { SBARService } from "@/lib/services/sbar-service";
import { SAMPLE_CONSULTATIONS } from "@/lib/data/sample-consultations";
import { aiOrchestrator } from "@/lib/ai/orchestrator";

export const DesktopHospitalWorkspace: React.FC = () => {
  const {
    departments,
    staff,
    currentStaff,
    patients,
    encounters,
    beds,
    observations,
    labs,
    orders,
    administrations,
    imaging,
    notes,
    activeEmergency,
    activePatientId,
    activeEncounterId,
    activePatient,
    activeEncounter,
    activeBed,
    activeDepartment,
    setActivePatientId,
    switchUserRole,
    completeBedCleaning,
    recordVitals,
    verifyOrderPharmacy,
    dispenseOrderPharmacy,
    administerMedication,
    signClinicalNote,
    triggerEmergencyCode,
    acknowledgeEmergencyCode,
    resolveEmergencyCode
  } = useHospital();

  // Navigation State
  // Active primary view: 'command' | 'chart' | 'beds' | 'cpoe' | 'scribe' | 'operations'
  const [activeView, setActiveView] = useState<'command' | 'chart' | 'beds' | 'cpoe' | 'scribe' | 'operations'>('chart');
  
  // Chart Sub-Tabs: 'flowsheet' | 'labs' | 'orders' | 'imaging' | 'notes' | 'timeline'
  const [chartSubTab, setChartSubTab] = useState<'flowsheet' | 'labs' | 'orders' | 'imaging' | 'notes' | 'timeline'>('flowsheet');

  // Selected Ward Filter
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('ALL');

  // Omni-Search Query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Lab Category Filter
  const [labFilter, setLabFilter] = useState<string>('ALL');

  // Modals state
  const [isCpoeModalOpen, setIsCpoeModalOpen] = useState(false);
  const [isAdtModalOpen, setIsAdtModalOpen] = useState(false);
  const [adtInitialMode, setAdtInitialMode] = useState<'ADMISSION' | 'TRANSFER' | 'DISCHARGE'>('TRANSFER');
  const [selectedStudyForPacs, setSelectedStudyForPacs] = useState<any | null>(null);

  // Vitals Quick-Entry Form state
  const [isVitalsEntryOpen, setIsVitalsEntryOpen] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    systolicBP: 138,
    diastolicBP: 82,
    heartRate: 78,
    respirationRate: 18,
    spO2: 97,
    spO2Scale: 1 as 1 | 2,
    supplementalOxygen: false,
    temperatureCelsius: 37.1,
    consciousness: 'ALERT' as const,
    bloodGlucoseMgDl: 188
  });

  // Ambient Scribe state
  const [selectedPreset, setSelectedPreset] = useState(SAMPLE_CONSULTATIONS[0]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [draftedSoap, setDraftedSoap] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });
  const [proposedOrders, setProposedOrders] = useState<any[]>([]);

  // SBAR Generated state
  const [generatedSbar, setGeneratedSbar] = useState<any | null>(null);

  // Computed patient specific data
  const patientObservations = useMemo(() => 
    observations.filter(o => o.patientId === activePatientId),
    [observations, activePatientId]
  );
  const latestObservation = patientObservations[0];
  const patientLabs = useMemo(() => 
    labs.filter(l => l.patientId === activePatientId),
    [labs, activePatientId]
  );
  const patientOrders = useMemo(() => 
    orders.filter(o => o.patientId === activePatientId),
    [orders, activePatientId]
  );
  const patientAdms = useMemo(() => 
    administrations.filter(a => a.patientId === activePatientId),
    [administrations, activePatientId]
  );
  const patientImaging = useMemo(() => 
    imaging.filter(i => i.patientId === activePatientId),
    [imaging, activePatientId]
  );
  const patientNotes = useMemo(() => 
    notes.filter(n => n.patientId === activePatientId),
    [notes, activePatientId]
  );

  // Filtered Patients according to Omni-Search
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(p => {
      const enc = encounters.find(e => e.patientId === p.id && e.status === 'ACTIVE');
      const b = beds.find(bed => bed.id === enc?.activeBedId);
      return (
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        (b && b.bedNumber.toLowerCase().includes(q)) ||
        (enc && enc.admittingDiagnosis.toLowerCase().includes(q))
      );
    });
  }, [patients, encounters, beds, searchQuery]);

  // Overall Hospital Stats
  const totalBedsCount = beds.length;
  const occupiedBedsCount = beds.filter(b => b.status === 'OCCUPIED').length;
  const availableBedsCount = beds.filter(b => b.status === 'AVAILABLE').length;
  const cleaningBedsCount = beds.filter(b => b.status === 'CLEANING').length;
  const highRiskPatientsCount = observations
    .filter(o => o.news2RiskTier === 'HIGH')
    .map(o => o.patientId)
    .filter((v, i, a) => a.indexOf(v) === i).length;

  // Handle Quick Vitals Submit
  const handleVitalsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordVitals({
      patientId: activePatientId,
      encounterId: activeEncounterId,
      ...vitalsForm
    });
    setIsVitalsEntryOpen(false);
  };

  // Generate SBAR Handover
  const handleGenerateSBAR = () => {
    const sbar = SBARService.generateSBAR(
      activePatient,
      activeEncounter,
      activeBed,
      latestObservation,
      patientLabs,
      patientOrders
    );
    setGeneratedSbar(sbar);
  };

  // Run Ambient AI Scribe
  const handleRunAmbientScribe = async () => {
    setIsTranscribing(true);
    try {
      const provider = aiOrchestrator.getProvider();
      const rawText = selectedPreset.dialogue.map(t => `${t.speaker}: ${t.text}`).join("\n");
      const generatedNote = await provider.generateClinicalNote(activePatient as any, rawText);
      setDraftedSoap({
        subjective: generatedNote.subjective,
        objective: generatedNote.objective,
        assessment: generatedNote.assessment,
        plan: generatedNote.plan
      });

      const extracted = await provider.extractActions(activePatient as any, rawText, generatedNote);
      setProposedOrders(extracted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSignSoapNote = () => {
    signClinicalNote({
      encounterId: activeEncounterId,
      patientId: activePatientId,
      authorId: currentStaff.id,
      noteType: 'SOAP_ENCOUNTER',
      subjective: { text: draftedSoap.subjective },
      objective: { text: draftedSoap.objective },
      assessment: { text: draftedSoap.assessment },
      plan: { text: draftedSoap.plan }
    });
    alert("SOAP Note signed and committed to EHR chart!");
  };

  const allergies = activePatient.allergies || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* ==================================================== */}
      {/* 1. LEFT CLINICAL NAVIGATION RAIL (240px Fixed)       */}
      {/* ==================================================== */}
      <aside className="w-60 bg-[#0F172A] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 select-none z-30">
        <div>
          {/* Workstation Header */}
          <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/60">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm text-white tracking-tight">HospitalOS</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Live" />
              </div>
              <p className="text-[10px] text-slate-400 truncate">St. Jude Metropolitan</p>
            </div>
          </div>

          {/* Navigation Menu Categories */}
          <nav className="p-3 space-y-5 text-xs">
            {/* COMMAND Section */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                Command
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveView('command')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2.5 transition font-medium ${
                    activeView === 'command' 
                      ? 'bg-blue-600 text-white font-semibold' 
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Command Center</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedWardFilter('dept-ed');
                    setActiveView('operations');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition font-medium ${
                    activeView === 'operations' && selectedWardFilter === 'dept-ed'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Flame className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Emergency (ED)</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-900/60 text-red-300 border border-red-700/50">
                    ESI 1-5
                  </span>
                </button>

                <button
                  onClick={() => {
                    setSelectedWardFilter('dept-icu');
                    setActiveView('beds');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition font-medium ${
                    activeView === 'beds' && selectedWardFilter === 'dept-icu'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <HeartPulse className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Intensive Care (ICU)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">3/4</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedWardFilter('dept-medsurg');
                    setActiveView('beds');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition font-medium ${
                    activeView === 'beds' && selectedWardFilter === 'dept-medsurg'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BedDouble className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Med-Surg Ward (3F)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">18/20</span>
                </button>
              </div>
            </div>

            {/* CLINICAL WORKSPACE Section */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                Clinical
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveView('chart')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition font-medium ${
                    activeView === 'chart' 
                      ? 'bg-blue-600 text-white font-semibold' 
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>EHR Patient Chart</span>
                  </div>
                  {latestObservation && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      latestObservation.news2RiskTier === 'HIGH' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      N:{latestObservation.news2Score}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveView('cpoe')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition font-medium ${
                    activeView === 'cpoe' 
                      ? 'bg-blue-600 text-white font-semibold' 
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Pill className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>CPOE &amp; Inpatient eMAR</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{patientOrders.length}</span>
                </button>

                <button
                  onClick={() => setActiveView('scribe')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition font-medium ${
                    activeView === 'scribe' 
                      ? 'bg-emerald-700 text-white font-semibold' 
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Ambient AI Scribe</span>
                  </div>
                  <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700 px-1 rounded">
                    AI
                  </span>
                </button>
              </div>
            </div>

            {/* OPERATIONS Section */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                Operations
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setSelectedWardFilter('ALL');
                    setActiveView('beds');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition font-medium ${
                    activeView === 'beds' && selectedWardFilter === 'ALL'
                      ? 'bg-blue-600 text-white font-semibold' 
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BedDouble className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Bed Matrix &amp; ADT</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{occupiedBedsCount}/{totalBedsCount}</span>
                </button>

                <button
                  onClick={() => setActiveView('operations')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition font-medium ${
                    activeView === 'operations' && selectedWardFilter === 'ALL'
                      ? 'bg-blue-600 text-white font-semibold' 
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Staff Coverage &amp; Drills</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{staff.length}</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom User / Attending Profile & Role Switcher */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentStaff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-xs truncate leading-tight">{currentStaff.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{currentStaff.role} • 07:00-19:00</p>
              </div>
            </div>
          </div>

          {/* Quick RBAC Role Pill Selector */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80 text-[10px]">
            <span className="text-slate-500 font-mono">ROLE:</span>
            {(['PHYSICIAN', 'NURSE', 'PHARMACIST'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => switchUserRole(r)}
                className={`px-1.5 py-0.5 rounded font-mono font-bold transition ${
                  currentStaff.role === r
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {r.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* 2. MAIN CLINICAL WORKSPACE CONTENT AREA              */}
      {/* ==================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* 🚨 SIMULATED EMERGENCY CODE ALERT BANNER */}
        {activeEmergency && (
          <div className="bg-[#EF4444] text-white px-6 py-2 flex items-center justify-between shadow-md z-40 border-b border-red-700">
            <div className="flex items-center space-x-3">
              <Radio className="w-4 h-4 text-white animate-spin" />
              <span className="font-bold text-xs tracking-wider uppercase">
                🚨 STAT {activeEmergency.codeType.replace('_', ' ')} ACTIVATED AT {activeEmergency.location}
              </span>
              <span className="text-[11px] bg-red-900 px-2 py-0.5 rounded font-mono font-bold">
                State: {activeEmergency.state}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {activeEmergency.state === 'ACTIVE' && (
                <button
                  onClick={() => acknowledgeEmergencyCode(activeEmergency.id)}
                  className="px-3 py-1 bg-white text-red-700 hover:bg-red-50 text-xs font-bold rounded shadow-xs"
                >
                  Acknowledge On-Scene
                </button>
              )}
              <button
                onClick={() => resolveEmergencyCode(activeEmergency.id)}
                className="px-3 py-1 bg-red-950 text-white hover:bg-black text-xs font-bold rounded"
              >
                Resolve Code
              </button>
            </div>
          </div>
        )}

        {/* TOP CLINICAL WORKSTATION TOOLBAR */}
        <header className="h-14 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between gap-4 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-20">
          
          {/* Left Toolbar: Ward Selector & Census Badges */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-xs">
              <span className="text-slate-500 font-semibold">Ward:</span>
              <select
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Hospital Units (System Wide)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.floor}F)</option>
                ))}
              </select>
            </div>

            {/* Inpatient Census Pill */}
            <div className="hidden xl:flex items-center space-x-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                Census: <strong>{occupiedBedsCount}/{totalBedsCount}</strong> ({Math.round((occupiedBedsCount/totalBedsCount)*100)}%)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                Available: {availableBedsCount}
              </span>
              {highRiskPatientsCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-600" />
                  <span>{highRiskPatientsCount} High NEWS2</span>
                </span>
              )}
            </div>
          </div>

          {/* Center Toolbar: Omni-Search Bar */}
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, MRN (e.g. 104829), bed 304-B, diagnosis..."
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded text-xs pl-9 pr-8 py-1.5 outline-none transition text-slate-900 placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Omni-search instantaneous dropdown */}
            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded shadow-xl max-h-64 overflow-y-auto z-50 text-xs divide-y divide-slate-100">
                {filteredPatients.length === 0 ? (
                  <div className="p-3 text-center text-slate-400">No matching patients found</div>
                ) : (
                  filteredPatients.map(p => {
                    const enc = encounters.find(e => e.patientId === p.id && e.status === 'ACTIVE');
                    const b = beds.find(bed => bed.id === enc?.activeBedId);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setActivePatientId(p.id);
                          setSearchQuery('');
                          setActiveView('chart');
                        }}
                        className="p-2.5 hover:bg-blue-50/70 cursor-pointer flex items-center justify-between transition"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{p.lastName}, {p.firstName}</span>
                          <span className="text-[11px] text-slate-500 font-mono ml-2">MRN: {p.mrn}</span>
                          <p className="text-[10px] text-slate-500">{enc?.admittingDiagnosis || 'Inpatient Care'}</p>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                          {b ? `Bed ${b.bedNumber}` : 'Outpatient'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Right Toolbar: Quick Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setAdtInitialMode('ADMISSION');
                setIsAdtModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300/80 transition flex items-center gap-1.5"
              title="Admit Patient"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>ADT Admit</span>
            </button>

            <button
              onClick={() => setIsCpoeModalOpen(true)}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ CPOE Order</span>
            </button>

            <button
              onClick={() => setIsVitalsEntryOpen(true)}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>+ Log Vitals</span>
            </button>
          </div>
        </header>

        {/* ==================================================== */}
        {/* CLINICAL PATIENT HEADER BANNER (Shown for Patient)   */}
        {/* ==================================================== */}
        {activeView === 'chart' && (
          <section className="bg-white border-b border-[#E2E8F0] px-6 py-2.5 shrink-0 select-none">
            <div className="flex flex-wrap items-center justify-between gap-3">
              
              {/* Patient Core Identity */}
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {activePatient.firstName[0]}{activePatient.lastName[0]}
                </div>

                <div>
                  <div className="flex items-center space-x-2.5">
                    <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                      {activePatient.lastName}, {activePatient.firstName}
                    </h1>
                    <span className="text-xs text-slate-500 font-medium font-mono">
                      {new Date().getFullYear() - new Date(activePatient.dateOfBirth).getFullYear()}yo {activePatient.sex}
                    </span>
                    <span className="font-mono text-xs text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                      MRN: {activePatient.mrn}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {activeBed ? `Bed ${activeBed.bedNumber}` : 'Outpatient'}
                    </span>
                    <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      {activeEncounter.codeStatus}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-0.5">
                    <span>Dx: <strong className="text-slate-800">{activeEncounter.admittingDiagnosis}</strong></span>
                    <span>• Attending: <strong>{activeEncounter.attendingPhysicianId}</strong></span>
                    <span>• Admitted: {new Date(activeEncounter.admittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Right Side Clinical Alerts: Red Allergy Box + NEWS2 Badge */}
              <div className="flex items-center space-x-3">
                {allergies.length > 0 ? (
                  <div className="px-3 py-1 rounded bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] text-xs font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    <span>ALLERGIES: {allergies.map(a => `${a.allergen} (${a.reaction})`).join(", ")}</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500 font-medium px-2.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                    NKDA
                  </span>
                )}

                {latestObservation && (
                  <div className={`px-2.5 py-1 rounded border text-xs font-bold font-mono flex items-center gap-1.5 ${
                    latestObservation.news2RiskTier === 'HIGH'
                      ? 'bg-red-50 border-red-400 text-red-700 animate-pulse'
                      : latestObservation.news2RiskTier === 'MEDIUM'
                      ? 'bg-amber-50 border-amber-400 text-amber-800'
                      : 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  }`}>
                    <Activity className="w-3.5 h-3.5" />
                    <span>NEWS2: {latestObservation.news2Score} ({latestObservation.news2RiskTier})</span>
                  </div>
                )}

                {/* SBAR Button */}
                <button
                  onClick={handleGenerateSBAR}
                  className="px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>SBAR Handover</span>
                </button>
              </div>
            </div>

            {/* Secondary Patient Chart Tabs */}
            <div className="flex items-center space-x-1 border-t border-slate-100 mt-2 pt-1 text-xs font-medium text-slate-600">
              <button
                onClick={() => setChartSubTab('flowsheet')}
                className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                  chartSubTab === 'flowsheet' ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>Vitals Flowsheet</span>
              </button>

              <button
                onClick={() => setChartSubTab('labs')}
                className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                  chartSubTab === 'labs' ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <Microscope className="w-3.5 h-3.5 text-emerald-600" />
                <span>Diagnostic Labs ({patientLabs.length})</span>
              </button>

              <button
                onClick={() => setChartSubTab('orders')}
                className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                  chartSubTab === 'orders' ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-purple-600" />
                <span>Active Orders &amp; eMAR ({patientOrders.length})</span>
              </button>

              <button
                onClick={() => setChartSubTab('imaging')}
                className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                  chartSubTab === 'imaging' ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>PACS Radiology ({patientImaging.length})</span>
              </button>

              <button
                onClick={() => setChartSubTab('notes')}
                className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                  chartSubTab === 'notes' ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Clinical Notes ({patientNotes.length})</span>
              </button>

              <button
                onClick={() => setChartSubTab('timeline')}
                className={`px-3 py-1 rounded transition flex items-center gap-1.5 ${
                  chartSubTab === 'timeline' ? 'bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>Timeline</span>
              </button>
            </div>
          </section>
        )}

        {/* MAIN SCROLLABLE CONTENT BODY */}
        <main className="flex-1 p-5 overflow-y-auto space-y-5">
          
          {/* ==================================================== */}
          {/* VIEW: COMMAND CENTER OVERVIEW                        */}
          {/* ==================================================== */}
          {activeView === 'command' && (
            <div className="space-y-5">
              
              {/* Ward Capacity Progress Bars */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Hospital Department Bed Utilization &amp; Telemetry Load
                  </h2>
                  <span className="text-xs font-mono text-slate-400">Systemwide Total: {occupiedBedsCount}/{totalBedsCount}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {departments.map(dept => {
                    const deptBeds = beds.filter(b => b.wardId === dept.id);
                    const occupied = deptBeds.filter(b => b.status === 'OCCUPIED').length;
                    const pct = Math.round((occupied / deptBeds.length) * 100);
                    return (
                      <div key={dept.id} className="p-3 rounded border border-slate-100 bg-slate-50 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{dept.name} ({dept.floor}F)</span>
                          <span className="font-mono text-slate-600 font-semibold">{occupied}/{deptBeds.length} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority Clinical Triage Worklist (NEWS2 Sorted Table) */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-red-600" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      Inpatient Clinical Priority Triage Worklist (NEWS2 Sorted)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {patients.length} active admitted encounters
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Bed</th>
                        <th className="py-2.5 px-3">Patient Name</th>
                        <th className="py-2.5 px-3">MRN</th>
                        <th className="py-2.5 px-3">Age / Sex</th>
                        <th className="py-2.5 px-3">Diagnosis</th>
                        <th className="py-2.5 px-3">NEWS2</th>
                        <th className="py-2.5 px-3">SpO2</th>
                        <th className="py-2.5 px-3">BP</th>
                        <th className="py-2.5 px-3">Heart Rate</th>
                        <th className="py-2.5 px-3">Code Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patients.map(p => {
                        const enc = encounters.find(e => e.patientId === p.id && e.status === 'ACTIVE');
                        const b = beds.find(bed => bed.id === enc?.activeBedId);
                        const obs = observations.filter(o => o.patientId === p.id)[0];
                        const isCurrent = p.id === activePatientId;

                        return (
                          <tr 
                            key={p.id}
                            onClick={() => {
                              setActivePatientId(p.id);
                              setActiveView('chart');
                            }}
                            className={`hover:bg-blue-50/50 cursor-pointer transition ${
                              isCurrent ? 'bg-blue-50/80 font-medium' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              {b ? b.bedNumber : 'Outpatient'}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {p.lastName}, {p.firstName}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{p.mrn}</td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()}yo {p.sex}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 max-w-[180px] truncate">
                              {enc?.admittingDiagnosis || 'Routine Care'}
                            </td>
                            <td className="py-2.5 px-3">
                              {obs ? (
                                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                  obs.news2RiskTier === 'HIGH'
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : obs.news2RiskTier === 'MEDIUM'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}>
                                  {obs.news2Score} ({obs.news2RiskTier})
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">--</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {obs ? `${obs.spO2}%` : '--'}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {obs ? `${obs.systolicBP}/${obs.diastolicBP}` : '--'}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {obs ? `${obs.heartRate} bpm` : '--'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                                {enc?.codeStatus || 'FULL_CODE'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePatientId(p.id);
                                  setActiveView('chart');
                                }}
                                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                              >
                                Open Chart
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: EHR PATIENT CHART (DENSE TABULAR SPREADSHEETS) */}
          {/* ==================================================== */}
          {activeView === 'chart' && (
            <div className="space-y-5">
              
              {/* Generated SBAR Overlay Box */}
              {generatedSbar && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-700" />
                      <span>Formal SBAR Inpatient Handover Protocol</span>
                    </h3>
                    <button
                      onClick={() => setGeneratedSbar(null)}
                      className="text-xs text-purple-700 hover:text-purple-900 font-semibold"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded border border-purple-100">
                      <strong className="text-purple-800 uppercase block mb-0.5">S — Situation</strong>
                      <p className="text-slate-700 leading-relaxed">{generatedSbar.situation}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded border border-purple-100">
                      <strong className="text-purple-800 uppercase block mb-0.5">B — Background</strong>
                      <p className="text-slate-700 leading-relaxed">{generatedSbar.background}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded border border-purple-100">
                      <strong className="text-purple-800 uppercase block mb-0.5">A — Assessment</strong>
                      <p className="text-slate-700 leading-relaxed">{generatedSbar.assessment}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded border border-purple-100">
                      <strong className="text-purple-800 uppercase block mb-0.5">R — Recommendation</strong>
                      <p className="text-slate-700 leading-relaxed">{generatedSbar.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 1: VITALS FLOWSHEET MATRIX */}
              {chartSubTab === 'flowsheet' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        Inpatient Clinical Flowsheet (Spreadsheet Matrix)
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400 font-mono">{patientObservations.length} timestamp logs</span>
                      <button
                        onClick={() => setIsVitalsEntryOpen(true)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded"
                      >
                        + Log Set
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Clinical Parameter</th>
                          <th className="py-2.5 px-3">Ref Range</th>
                          {patientObservations.map((obs) => (
                            <th key={obs.id} className="py-2.5 px-3 font-mono">
                              {new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Systolic BP */}
                        <tr className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">Systolic Blood Pressure</td>
                          <td className="py-2 px-3 font-mono text-slate-400">100 - 139 mmHg</td>
                          {patientObservations.map(obs => (
                            <td key={obs.id} className={`py-2 px-3 font-mono font-bold ${
                              obs.systolicBP > 140 || obs.systolicBP < 90 ? 'bg-red-50 text-red-700' : 'text-slate-800'
                            }`}>
                              {obs.systolicBP}
                            </td>
                          ))}
                        </tr>

                        {/* Diastolic BP */}
                        <tr className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">Diastolic Blood Pressure</td>
                          <td className="py-2 px-3 font-mono text-slate-400">60 - 89 mmHg</td>
                          {patientObservations.map(obs => (
                            <td key={obs.id} className={`py-2 px-3 font-mono font-bold ${
                              obs.diastolicBP > 90 || obs.diastolicBP < 60 ? 'bg-amber-50 text-amber-800' : 'text-slate-800'
                            }`}>
                              {obs.diastolicBP}
                            </td>
                          ))}
                        </tr>

                        {/* Heart Rate */}
                        <tr className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">Heart Rate (Pulse)</td>
                          <td className="py-2 px-3 font-mono text-slate-400">51 - 90 bpm</td>
                          {patientObservations.map(obs => (
                            <td key={obs.id} className={`py-2 px-3 font-mono font-bold ${
                              obs.heartRate > 90 || obs.heartRate < 50 ? 'bg-red-50 text-red-700' : 'text-slate-800'
                            }`}>
                              {obs.heartRate}
                            </td>
                          ))}
                        </tr>

                        {/* Respiration Rate */}
                        <tr className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">Respiration Rate</td>
                          <td className="py-2 px-3 font-mono text-slate-400">12 - 20 /min</td>
                          {patientObservations.map(obs => (
                            <td key={obs.id} className={`py-2 px-3 font-mono font-bold ${
                              obs.respirationRate > 20 || obs.respirationRate < 12 ? 'bg-amber-50 text-amber-800' : 'text-slate-800'
                            }`}>
                              {obs.respirationRate}
                            </td>
                          ))}
                        </tr>

                        {/* SpO2 */}
                        <tr className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">Oxygen Saturation (SpO2)</td>
                          <td className="py-2 px-3 font-mono text-slate-400">≥ 96%</td>
                          {patientObservations.map(obs => (
                            <td key={obs.id} className={`py-2 px-3 font-mono font-bold ${
                              obs.spO2 < 95 ? 'bg-red-50 text-red-700' : 'text-slate-800'
                            }`}>
                              {obs.spO2}% {obs.supplementalOxygen && <span className="text-[10px] text-blue-600">(O2)</span>}
                            </td>
                          ))}
                        </tr>

                        {/* Temperature */}
                        <tr className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">Temperature</td>
                          <td className="py-2 px-3 font-mono text-slate-400">36.1 - 38.0 °C</td>
                          {patientObservations.map(obs => (
                            <td key={obs.id} className="py-2 px-3 font-mono text-slate-800">
                              {obs.temperatureCelsius.toFixed(1)}°C
                            </td>
                          ))}
                        </tr>

                        {/* Blood Glucose */}
                        <tr className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">Fingerstick Glucose</td>
                          <td className="py-2 px-3 font-mono text-slate-400">70 - 140 mg/dL</td>
                          {patientObservations.map(obs => (
                            <td key={obs.id} className={`py-2 px-3 font-mono font-bold ${
                              (obs.bloodGlucoseMgDl || 0) > 180 ? 'bg-red-50 text-red-700' : 'text-slate-800'
                            }`}>
                              {obs.bloodGlucoseMgDl || '--'}
                            </td>
                          ))}
                        </tr>

                        {/* NEWS2 Total Score */}
                        <tr className="bg-slate-50 font-bold border-t border-slate-200">
                          <td className="py-2.5 px-3 text-blue-900 font-bold">RCP NEWS2 Aggregate Score</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">0 - 4 Normal</td>
                          {patientObservations.map(obs => (
                            <td key={obs.id} className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                obs.news2RiskTier === 'HIGH'
                                  ? 'bg-red-600 text-white'
                                  : obs.news2RiskTier === 'MEDIUM'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}>
                                {obs.news2Score} ({obs.news2RiskTier})
                              </span>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: DIAGNOSTIC LABS TABLE */}
              {chartSubTab === 'labs' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden space-y-3">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center space-x-3">
                      <Microscope className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        Diagnostic Laboratory Biomarkers &amp; Chemistry
                      </h3>
                    </div>

                    {/* Filter by Category */}
                    <div className="flex items-center space-x-1.5 text-xs">
                      {['ALL', 'HEMATOLOGY', 'CHEMISTRY', 'CARDIAC', 'ENDOCRINE'].map(c => (
                        <button
                          key={c}
                          onClick={() => setLabFilter(c)}
                          className={`px-2 py-0.5 rounded font-mono transition text-[11px] ${
                            labFilter === c ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Test Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Result Value</th>
                          <th className="py-2.5 px-3">Reference Range</th>
                          <th className="py-2.5 px-3">Status Flag</th>
                          <th className="py-2.5 px-3">Collection Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patientLabs
                          .filter(l => labFilter === 'ALL' || l.category === labFilter)
                          .map(lab => (
                            <tr key={lab.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-bold text-slate-900">{lab.testName}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{lab.category}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-800 font-mono">
                                {lab.value} <span className="font-normal text-slate-500">{lab.unit}</span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-500">{lab.referenceRange}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  lab.flag === 'HIGH' || lab.flag === 'CRITICAL_HIGH'
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : lab.flag === 'LOW' || lab.flag === 'CRITICAL_LOW'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {lab.flag}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                                {new Date(lab.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: ORDERS & eMAR */}
              {chartSubTab === 'orders' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  
                  {/* Left: Active Orders */}
                  <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-purple-600" />
                        <span>Active CPOE Orders ({patientOrders.length})</span>
                      </h3>
                      <button
                        onClick={() => setIsCpoeModalOpen(true)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded"
                      >
                        + Place Order
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      {patientOrders.map(order => (
                        <div key={order.id} className="py-2.5 flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900">{order.title}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {order.orderType}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                order.status === 'DISPENSED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.status === 'PHARMACY_VERIFIED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] mt-0.5">{order.description}</p>
                          </div>

                          {/* Pharmacist verify / dispense */}
                          {currentStaff.role === 'PHARMACIST' && (
                            <div className="shrink-0">
                              {order.status === 'ORDERED' && (
                                <button
                                  onClick={() => verifyOrderPharmacy(order.id)}
                                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded"
                                >
                                  Verify
                                </button>
                              )}
                              {order.status === 'PHARMACY_VERIFIED' && (
                                <button
                                  onClick={() => dispenseOrderPharmacy(order.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded"
                                >
                                  Dispense
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Inpatient eMAR Administration Grid */}
                  <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <Syringe className="w-4 h-4 text-blue-600" />
                        <span>Today's eMAR Administration Schedule</span>
                      </h3>
                    </div>

                    <div className="space-y-2 text-xs">
                      {patientAdms.map(adm => {
                        const ord = orders.find(o => o.id === adm.orderId);
                        return (
                          <div key={adm.id} className="p-2.5 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900">{ord?.title}</span>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Scheduled: {new Date(adm.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Status: <strong className={adm.status === 'GIVEN' ? 'text-emerald-700' : 'text-slate-700'}>{adm.status}</strong>
                              </div>
                            </div>

                            {adm.status !== 'GIVEN' ? (
                              <button
                                onClick={() => administerMedication({ administrationId: adm.id, status: 'GIVEN' })}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded"
                              >
                                Confirm Given
                              </button>
                            ) : (
                              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Given
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: PACS RADIOLOGY */}
              {chartSubTab === 'imaging' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span>Diagnostic Radiology &amp; DICOM PACS Studies ({patientImaging.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patientImaging.map(study => (
                      <div
                        key={study.id}
                        onClick={() => setSelectedStudyForPacs(study)}
                        className="p-3 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center space-x-3 transition group"
                      >
                        <div className="w-20 h-20 bg-black rounded overflow-hidden shrink-0 border border-slate-300 relative">
                          <img
                            src={study.imageThumbnailUrl}
                            alt={study.studyType}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </div>

                        <div className="flex-1 min-w-0 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 truncate">{study.studyType}</span>
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">
                              {study.modality}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                            {study.impression}
                          </p>
                          <span className="text-blue-600 font-bold text-[11px] mt-1.5 inline-block">
                            Click to Open Full PACS Viewer →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: CLINICAL NOTES */}
              {chartSubTab === 'notes' && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      Signed Clinical Notes &amp; Encounters ({patientNotes.length})
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    {patientNotes.map(note => (
                      <div key={note.id} className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{note.noteType}</span>
                            <span className="text-slate-400 font-mono text-[11px]">Author: {note.authorId}</span>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {new Date(note.signedAt || note.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700 text-[11px] bg-white p-2.5 rounded border border-slate-100">
                          <div><strong className="text-blue-700 block">S:</strong> {note.subjective?.text || 'N/A'}</div>
                          <div><strong className="text-blue-700 block">O:</strong> {note.objective?.text || 'N/A'}</div>
                          <div><strong className="text-emerald-700 block">A:</strong> {note.assessment?.text || 'N/A'}</div>
                          <div><strong className="text-emerald-700 block">P:</strong> {note.plan?.text || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB 6: TIMELINE */}
              {chartSubTab === 'timeline' && (
                <PatientTimelineView />
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: WARDS & BED MATRIX (ADT)                       */}
          {/* ==================================================== */}
          {activeView === 'beds' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Hospital Bed Matrix &amp; ADT State Machine
                  </h2>
                  <p className="text-[11px] text-slate-500">Live floor-plan occupancy matrix</p>
                </div>

                <button
                  onClick={() => {
                    setAdtInitialMode('ADMISSION');
                    setIsAdtModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow-xs"
                >
                  + Admit Inpatient
                </button>
              </div>

              {/* Department Wards */}
              {departments
                .filter(d => selectedWardFilter === 'ALL' || d.id === selectedWardFilter)
                .map(dept => {
                  const deptBeds = beds.filter(b => b.wardId === dept.id);
                  return (
                    <div key={dept.id} className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs font-mono">
                            {dept.floor}F
                          </span>
                          <h3 className="font-bold text-xs text-slate-900">{dept.name}</h3>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {deptBeds.filter(b => b.status === 'OCCUPIED').length} / {deptBeds.length} Occupied
                        </span>
                      </div>

                      {/* Beds Array */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                        {deptBeds.map(bed => {
                          const occupant = patients.find(p => p.id === bed.currentPatientId);
                          const isOccupied = bed.status === 'OCCUPIED';
                          const isCleaning = bed.status === 'CLEANING';
                          const isAvailable = bed.status === 'AVAILABLE';

                          return (
                            <div
                              key={bed.id}
                              className={`p-2.5 rounded border flex flex-col justify-between text-xs transition ${
                                isOccupied
                                  ? 'bg-blue-50/70 border-blue-200'
                                  : isCleaning
                                  ? 'bg-amber-50/70 border-amber-200'
                                  : 'bg-emerald-50/50 border-emerald-200'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold font-mono text-slate-900">{bed.bedNumber}</span>
                                  <span className={`text-[9px] font-bold px-1 py-0.2 rounded font-mono ${
                                    isOccupied ? 'bg-blue-200 text-blue-900' : isCleaning ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                                  }`}>
                                    {bed.status}
                                  </span>
                                </div>

                                {isOccupied && occupant && (
                                  <div
                                    onClick={() => {
                                      setActivePatientId(occupant.id);
                                      setActiveView('chart');
                                    }}
                                    className="cursor-pointer hover:underline"
                                  >
                                    <p className="font-bold text-slate-900 truncate">{occupant.lastName}, {occupant.firstName}</p>
                                    <p className="text-[10px] font-mono text-slate-500">MRN: {occupant.mrn}</p>
                                  </div>
                                )}

                                {isCleaning && (
                                  <button
                                    onClick={() => completeBedCleaning(bed.id)}
                                    className="w-full mt-1 py-0.5 text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
                                  >
                                    Mark Clean
                                  </button>
                                )}

                                {isAvailable && (
                                  <p className="text-[10px] text-emerald-700 font-medium">Ready for admission</p>
                                )}
                              </div>

                              <div className="pt-1.5 mt-1.5 border-t border-slate-200 text-[9px] font-mono text-slate-400">
                                {bed.isIcuEquipped ? "ICU Capable" : "Standard"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: CPOE & PHARMACY QUEUE                          */}
          {/* ==================================================== */}
          {activeView === 'cpoe' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    CPOE Inpatient Order Management &amp; Verification Pipeline
                  </h2>
                  <p className="text-[11px] text-slate-500">Deterministic CDS contraindication safety protected</p>
                </div>

                <button
                  onClick={() => setIsCpoeModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs"
                >
                  + Place CPOE Order
                </button>
              </div>

              {/* All System Active Orders Table */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Order Details</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map(o => {
                      const p = patients.find(pat => pat.id === o.patientId);
                      return (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {p ? `${p.lastName}, ${p.firstName}` : o.patientId}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800">{o.title}</span>
                            <p className="text-slate-500 text-[11px]">{o.description}</p>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{o.orderType}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">
                            <span className={o.priority === 'STAT' ? 'text-red-600' : 'text-slate-700'}>
                              {o.priority}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                              o.status === 'DISPENSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {o.status === 'ORDERED' && currentStaff.role === 'PHARMACIST' && (
                              <button
                                onClick={() => verifyOrderPharmacy(o.id)}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded"
                              >
                                Verify
                              </button>
                            )}
                            {o.status === 'PHARMACY_VERIFIED' && currentStaff.role === 'PHARMACIST' && (
                              <button
                                onClick={() => dispenseOrderPharmacy(o.id)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded"
                              >
                                Dispense
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: AMBIENT AI CLINICAL SCRIBE                     */}
          {/* ==================================================== */}
          {activeView === 'scribe' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Ambient AI Clinical Scribe &amp; SOAP Synthesis</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">Live consultation transcript processing with grounded citations</p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={selectedPreset.id}
                    onChange={(e) => {
                      const found = SAMPLE_CONSULTATIONS.find(c => c.id === e.target.value);
                      if (found) setSelectedPreset(found);
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs rounded px-2.5 py-1.5 font-medium outline-none"
                  >
                    {SAMPLE_CONSULTATIONS.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleRunAmbientScribe}
                    disabled={isTranscribing}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isTranscribing ? "Synthesizing..." : "Process Dialogue"}</span>
                  </button>
                </div>
              </div>

              {/* Split Pane: Transcript vs Grounded SOAP Note */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left: Dialogue Transcript */}
                <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-xs p-4 h-[520px] flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <span className="font-bold text-xs text-slate-900">Audio Dialogue Transcript</span>
                    <span className="text-[11px] text-slate-400 font-mono">{selectedPreset.dialogue.length} turns</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                    {selectedPreset.dialogue.map((t, idx) => (
                      <div key={idx} className={`p-2.5 rounded border ${
                        t.speaker === 'Clinician' ? 'bg-blue-50/70 border-blue-100' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-[10px] uppercase text-slate-700">{t.speaker}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{t.timestamp}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed">{t.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Synthesized SOAP Note with Commit */}
                <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-xs p-4 h-[520px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <span className="font-bold text-xs text-slate-900">Synthesized Structured Note</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Evidence Grounded
                      </span>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                        <strong className="text-blue-700 block mb-0.5">S — Subjective</strong>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {draftedSoap.subjective || "Click 'Process Dialogue' above to extract subjective history."}
                        </p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                        <strong className="text-blue-700 block mb-0.5">O — Objective</strong>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {draftedSoap.objective || "Objective vitals and exam details will appear here."}
                        </p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                        <strong className="text-emerald-700 block mb-0.5">A — Assessment</strong>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {draftedSoap.assessment || "Clinical assessment will populate automatically."}
                        </p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                        <strong className="text-emerald-700 block mb-0.5">P — Plan</strong>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {draftedSoap.plan || "Diagnostic testing and therapy orders."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={handleSignSoapNote}
                      disabled={!draftedSoap.subjective}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs disabled:opacity-50"
                    >
                      Formally Sign &amp; Commit to Patient EHR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: OPERATIONS & EMERGENCY DRILLS                  */}
          {/* ==================================================== */}
          {activeView === 'operations' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Hospital Operations &amp; Emergency Management
                  </h2>
                  <p className="text-[11px] text-slate-500">Live drill simulations, staff coverage, and emergency response</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => triggerEmergencyCode('CODE_BLUE', 'Med-Surg Ward Bed 304-B')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded shadow-xs flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Simulate CODE BLUE</span>
                  </button>
                  <button
                    onClick={() => triggerEmergencyCode('RAPID_RESPONSE', '3rd Floor Hallway')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded shadow-xs flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Rapid Response</span>
                  </button>
                </div>
              </div>

              {/* Staff Roster Grid */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  On-Duty Staff &amp; Coverage Pager Schedule
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {staff.map(s => (
                    <div key={s.id} className="p-3 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{s.name}</p>
                        <p className="text-slate-500 text-[11px]">{s.role} • Pager: {s.pagerNumber || 'N/A'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        s.onCall ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {s.onCall ? 'ON-CALL' : 'SHIFT'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      <CpoeOrderModal
        isOpen={isCpoeModalOpen}
        onClose={() => setIsCpoeModalOpen(false)}
      />

      <AdtModal
        isOpen={isAdtModalOpen}
        onClose={() => setIsAdtModalOpen(false)}
        initialMode={adtInitialMode}
      />

      <PacsStyleViewerModal
        study={selectedStudyForPacs}
        onClose={() => setSelectedStudyForPacs(null)}
      />

      {/* QUICK INPATIENT VITALS ENTRY MODAL */}
      {isVitalsEntryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Record Inpatient Vitals (NEWS2 Engine)</h3>
              <button onClick={() => setIsVitalsEntryOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleVitalsSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={vitalsForm.systolicBP}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, systolicBP: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={vitalsForm.diastolicBP}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, diastolicBP: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={vitalsForm.heartRate}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Respiration Rate</label>
                  <input
                    type="number"
                    value={vitalsForm.respirationRate}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, respirationRate: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">SpO2 (%)</label>
                  <input
                    type="number"
                    value={vitalsForm.spO2}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, spO2: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsForm.temperatureCelsius}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temperatureCelsius: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsVitalsEntryOpen(false)}
                  className="px-3 py-1.5 border rounded text-slate-600 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded"
                >
                  Save &amp; Compute NEWS2
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
