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
  ListOrdered,
  Ambulance,
  Zap
} from "lucide-react";
import { useHospital } from "@/lib/state/hospital-store";
import { UserRole, OrderType, VitalSignObservation, DiagnosticLabResult } from "@/types/hospital";
import { PacsStyleViewerModal } from "../imaging/PacsStyleViewerModal";
import { CpoeOrderModal } from "../cpoe/CpoeOrderModal";
import { DoseAdministrationModal } from "../cpoe/DoseAdministrationModal";
import { AdtModal } from "../adt/AdtModal";
import { PatientTimelineView } from "../timeline/PatientTimelineView";
import { SBARService } from "@/lib/services/sbar-service";
import { SAMPLE_CONSULTATIONS } from "@/lib/data/sample-consultations";
import { aiOrchestrator } from "@/lib/ai/orchestrator";
import { FacilityOperationsWorkspace } from "../facility";
import { PatientRegistryWorkspace } from "../patients";
import { VitalsFlowsheet, VitalsEntryModal } from "../vitals";
import { AmbientScribeWorkspace } from "../scribe";
import { EmergencyWorkspace } from "../emergency";

export interface DesktopHospitalWorkspaceProps {
  externalView?: string;
}

export const DesktopHospitalWorkspace: React.FC<DesktopHospitalWorkspaceProps> = ({ externalView }) => {
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
  // Active primary view: command center -> patient workspace -> operations/meds/imaging/pharmacy -> task-specific views
  const [activeView, setActiveView] = useState<'command' | 'chart' | 'orders' | 'medications' | 'imaging' | 'pharmacy' | 'beds' | 'scribe' | 'operations' | 'ot' | 'facility_admin' | 'registry' | 'emergency' | 'trauma'>('command');
  
  // Sync with AppShell activeView if provided
  React.useEffect(() => {
    if (externalView) {
      if (externalView === 'facility_admin') {
        setActiveView('facility_admin');
      } else if (externalView === 'registry') {
        setActiveView('registry');
      } else if (externalView === 'emergency' || externalView === 'trauma') {
        setActiveView('emergency');
      } else if (['command', 'chart', 'orders', 'medications', 'imaging', 'pharmacy', 'beds', 'scribe', 'operations', 'ot', 'cpoe'].includes(externalView)) {
        setActiveView(externalView as any);
      }
    }
  }, [externalView]);
  
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
  const [selectedAdminForDose, setSelectedAdminForDose] = useState<{ adm: any; ord: any } | null>(null);

  // Vitals Quick-Entry Form state
  const [isVitalsEntryOpen, setIsVitalsEntryOpen] = useState(false);

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

  const otSchedule = useMemo(() => [
    {
      id: 'OT-105',
      room: 'OR-05',
      patient: activePatient.lastName + ', ' + activePatient.firstName,
      mrn: activePatient.mrn,
      procedure: 'Laparoscopic Cholecystectomy',
      surgeon: 'Dr. T. Alvarez',
      anesthetist: 'Dr. M. Lee',
      status: 'IN_PROGRESS',
      time: '07:50',
      specialty: 'General Surgery',
      external: false
    },
    {
      id: 'OT-118',
      room: 'OR-02',
      patient: 'Nolan, Harriet',
      mrn: 'MRN-40891',
      procedure: 'Total Knee Arthroplasty',
      surgeon: 'Dr. D. Patel',
      anesthetist: 'Dr. C. Ruiz',
      status: 'PREP',
      time: '08:25',
      specialty: 'Orthopaedics',
      external: false
    },
    {
      id: 'OT-221',
      room: 'Satellite Suite',
      patient: 'Foster, Mila',
      mrn: 'MRN-21964',
      procedure: 'Endoscopic Sinus Procedure',
      surgeon: 'Dr. J. Osei',
      anesthetist: 'Dr. S. Green',
      status: 'TRANSPORT',
      time: '09:10',
      specialty: 'ENT',
      external: true
    }
  ], [activePatient]);

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
    <div className="min-h-screen bg-[#F4F6F8] text-[#172033] flex antialiased selection:bg-[#2563EB] selection:text-white">
      
      {/* ==================================================== */}
      {/* 1. LEFT CLINICAL NAVIGATION RAIL (240px Fixed)       */}
      {/* ==================================================== */}
      <aside className="w-60 bg-[#F8FAFC] text-[#475569] flex flex-col justify-between shrink-0 border-r border-[#D7DEE7] select-none z-30">
        <div>
          {/* Workstation Header */}
          <div className="p-4 border-b border-[#D7DEE7] flex items-center space-x-3 bg-[#F8FAFC]">
            <div className="w-8 h-8 rounded-md bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[15px] text-[#172033] tracking-tight">HospitalOS</span>
                <span className="w-2 h-2 rounded-full bg-[#15803D]" title="System Live" />
              </div>
              <p className="text-[10px] text-[#64748B] truncate">St. Jude Metropolitan</p>
            </div>
          </div>

          {/* Navigation Menu Categories */}
          <nav className="p-3 space-y-5 text-xs">
            {/* COMMAND Section */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                Command
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setActiveView('command')}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center gap-2.5 transition font-medium ${
                    activeView === 'command'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 shrink-0" />
                  <span>Command Center</span>
                </button>

                <button
                  onClick={() => setActiveView('ot')}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'ot'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Stethoscope className="w-4 h-4 shrink-0" />
                    <span>OT / Theatre</span>
                  </div>
                  <span className="text-[10px] font-mono">{otSchedule.length}</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedWardFilter('dept-ed');
                    setActiveView('operations');
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'operations' && selectedWardFilter === 'dept-ed'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Flame className="w-4 h-4 shrink-0" />
                    <span>Emergency (ED)</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 border border-red-200">
                    ESI 1-5
                  </span>
                </button>

                <button
                  onClick={() => {
                    setSelectedWardFilter('dept-icu');
                    setActiveView('beds');
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'beds' && selectedWardFilter === 'dept-icu'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <HeartPulse className="w-4 h-4 shrink-0" />
                    <span>ICU</span>
                  </div>
                  <span className="text-[10px] font-mono">3/4</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedWardFilter('dept-medsurg');
                    setActiveView('beds');
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'beds' && selectedWardFilter === 'dept-medsurg'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BedDouble className="w-4 h-4 shrink-0" />
                    <span>Med-Surg (3F)</span>
                  </div>
                  <span className="text-[10px] font-mono">18/20</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                Clinical
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setActiveView('chart')}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'chart'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 shrink-0" />
                    <span>Patient Workspace</span>
                  </div>
                  {latestObservation && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      latestObservation.news2RiskTier === 'HIGH' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      N:{latestObservation.news2Score}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveView('registry')}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'registry'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Patient Registry</span>
                  </div>
                  <span className="text-[10px] font-mono">{patients.length}</span>
                </button>

                <button
                  onClick={() => setActiveView('orders')}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'orders'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Pill className="w-4 h-4 shrink-0" />
                    <span>Orders</span>
                  </div>
                  <span className="text-[10px] font-mono">{patientOrders.length}</span>
                </button>

                <button
                  onClick={() => setActiveView('medications')}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'medications'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Syringe className="w-4 h-4 shrink-0" />
                    <span>Medications</span>
                  </div>
                  <span className="text-[10px] font-mono">{patientAdms.length}</span>
                </button>

                <button
                  onClick={() => setActiveView('imaging')}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'imaging'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Eye className="w-4 h-4 shrink-0" />
                    <span>Imaging</span>
                  </div>
                  <span className="text-[10px] font-mono">{patientImaging.length}</span>
                </button>

                <button
                  onClick={() => setActiveView('scribe')}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'scribe'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>AI Scribe</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-1 rounded">
                    AI
                  </span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
                Operations
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setSelectedWardFilter('ALL');
                    setActiveView('beds');
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'beds' && selectedWardFilter === 'ALL'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BedDouble className="w-4 h-4 shrink-0" />
                    <span>Bed Management</span>
                  </div>
                  <span className="text-[10px] font-mono">{occupiedBedsCount}/{totalBedsCount}</span>
                </button>

                <button
                  onClick={() => setActiveView('pharmacy')}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'pharmacy'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Pill className="w-4 h-4 shrink-0" />
                    <span>Pharmacy</span>
                  </div>
                  <span className="text-[10px] font-mono">{orders.filter(o => o.status === 'ORDERED').length}</span>
                </button>

                <button
                  onClick={() => setActiveView('operations')}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium ${
                    activeView === 'operations' && selectedWardFilter === 'ALL'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Staff Coverage</span>
                  </div>
                  <span className="text-[10px] font-mono">{staff.length}</span>
                </button>

                <button
                  onClick={() => setActiveView('emergency')}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium col-span-2 ${
                    activeView === 'emergency' || activeView === 'trauma'
                      ? 'bg-bji-red-700 text-white border-bji-red-700 font-semibold'
                      : 'bg-white text-bji-red-700 border-bji-red-200 hover:bg-bji-red-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Ambulance className="w-4 h-4 shrink-0 text-bji-red-600" />
                    <span className="font-bold">Emergency &amp; Trauma Bays</span>
                  </div>
                  <span className="text-[10px] bg-bji-red-100 text-bji-red-800 font-mono font-bold px-1.5 py-0.5 rounded border border-bji-red-300">
                    STAT
                  </span>
                </button>

                <button
                  onClick={() => setActiveView('facility_admin')}
                  className={`w-full text-left px-2 py-1.5 rounded-md border flex items-center justify-between transition font-medium col-span-2 ${
                    activeView === 'facility_admin'
                      ? 'bg-[#0f172a] text-white border-[#0f172a] font-semibold'
                      : 'bg-white text-slate-700 border-[#d7dee7] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 shrink-0 text-bji-green-600" />
                    <span>Facility Ops &amp; Admin</span>
                  </div>
                  <span className="text-[10px] bg-bji-green-50 text-bji-green-700 font-mono font-bold px-1 rounded border border-bji-green-200">
                    Tenant
                  </span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom User / Attending Profile & Role Switcher */}
        <div className="p-3 border-t border-[#D7DEE7] bg-[#F8FAFC] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded bg-[#1D4ED8] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                {currentStaff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#172033] text-xs truncate leading-tight">{currentStaff.name}</p>
                <p className="text-[10px] text-[#64748B] font-mono">{currentStaff.role} • 07:00-19:00</p>
              </div>
            </div>
          </div>

          {/* Quick RBAC Role Switcher */}
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#D7DEE7] text-[10px]">
            <span className="text-[#64748B] font-mono">ROLE:</span>
            {(['PHYSICIAN', 'NURSE', 'PHARMACIST'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => switchUserRole(r)}
                className={`px-1.5 py-0.5 rounded font-mono font-bold transition ${
                  currentStaff.role === r
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white text-[#475569] border border-[#D7DEE7] hover:border-[#B7C2D0]'
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
        <header className="h-[58px] bg-[#f5f3ef] border-b border-[#D7DEE7] px-5 flex items-center justify-between gap-4 shrink-0 z-20">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[15px] font-bold tracking-tight text-[#111827]">HOSPITALOS</span>
              <span className="text-[12px] text-[#64748B]">St. Jude Metropolitan</span>
            </div>

            <div className="hidden lg:flex items-center gap-3 text-[12px] text-[#475569]">
              <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#D7DEE7] rounded px-2 py-1">
                <span className="font-semibold text-[#172033]">WARD:</span>
                <select
                  value={selectedWardFilter}
                  onChange={(e) => setSelectedWardFilter(e.target.value)}
                  className="bg-transparent font-semibold text-[#172033] outline-none cursor-pointer"
                >
                  <option value="ALL">3F MED-SURG</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <span className="font-medium text-[#475569]">Hospital Census</span>
              <span className="font-bold text-[#172033] font-mono">{occupiedBedsCount} / {totalBedsCount}</span>
              <span className="text-[#64748B]">Critical Alerts</span>
              <span className="font-bold text-[#172033] font-mono">{highRiskPatientsCount}</span>
            </div>
          </div>

          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, MRN, bed, encounter..."
                className="w-full bg-[#F8FAFC] border border-[#D7DEE7] focus:border-[#2563EB] focus:bg-white rounded-[4px] text-[12px] pl-9 pr-8 py-1.5 outline-none transition text-[#172033] placeholder:text-[#64748B]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[#64748B] hover:text-[#172033] text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setAdtInitialMode('ADMISSION');
                setIsAdtModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-[4px] bg-[#F8FAFC] hover:bg-[#EEF2F7] text-[#475569] text-[11px] font-semibold border border-[#D7DEE7] transition"
            >
              ADT Admit
            </button>

            <button
              onClick={() => setIsCpoeModalOpen(true)}
              className="px-3 py-1.5 rounded-[4px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-bold transition"
            >
              + CPOE
            </button>

            <button
              onClick={() => setIsVitalsEntryOpen(true)}
              className="px-3 py-1.5 rounded-[4px] bg-[#15803D] hover:bg-[#166534] text-white text-[11px] font-bold transition"
            >
              + Vitals
            </button>
          </div>
        </header>

        {/* ==================================================== */}
        {/* CLINICAL PATIENT HEADER BANNER (Persistent across workspaces) */}
        {/* ==================================================== */}
        <section className="bg-[#f7f5f2] border-b border-[#E2E8F0] px-6 py-2.5 shrink-0 select-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded bg-[#0f172a] text-white flex items-center justify-center font-bold text-sm shrink-0 border border-slate-700">
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

              <button
                onClick={handleGenerateSBAR}
                className="px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>SBAR Handover</span>
              </button>
            </div>
          </div>

          {activeView === 'chart' && (
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
          )}
        </section>

        {/* MAIN SCROLLABLE CONTENT BODY */}
        <main className="flex-1 p-5 overflow-y-auto space-y-5">
          
          {/* ==================================================== */}
          {/* VIEW: COMMAND CENTER OVERVIEW                        */}
          {/* ==================================================== */}
          {activeView === 'command' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[#64748B] font-semibold">Command Center</div>
                  <h2 className="text-[20px] font-bold text-[#172033] mt-1">3F Med-Surg</h2>
                </div>
                <div className="text-[12px] text-[#475569]">
                  Wednesday, September 30, 2026 <span className="font-semibold text-[#172033]">• Shift 07:00–19:00</span>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.9fr] gap-5">
                <div className="space-y-5">
                  <div className="bg-white border border-[#D7DEE7] rounded-[6px] p-4">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E7ECF3]">
                      <h3 className="text-[12px] uppercase tracking-[0.14em] font-bold text-[#475569]">Ward status</h3>
                      <span className="text-[11px] font-mono text-[#64748B]">Census {occupiedBedsCount}/{totalBedsCount}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-[11px]">
                      {[
                        ['ED', '12 patients'],
                        ['ICU', '3 / 4'],
                        ['MED-SURG', '18 / 20'],
                        ['OR', '2 active']
                      ].map(([label, value]) => (
                        <div key={label} className="border border-[#D7DEE7] rounded-[4px] bg-[#F8FAFC] px-3 py-2">
                          <div className="text-[#64748B] font-medium">{label}</div>
                          <div className="mt-1 font-bold text-[#172033]">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-[#D7DEE7] rounded-[6px] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7ECF3] bg-[#F8FAFC]">
                      <h3 className="text-[12px] uppercase tracking-[0.14em] font-bold text-[#475569]">Bed / patient matrix</h3>
                      <span className="text-[11px] text-[#64748B] font-mono">Live occupancy</span>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {departments.filter(d => selectedWardFilter === 'ALL' || d.id === selectedWardFilter).map(dept => {
                        const deptBeds = beds.filter(b => b.wardId === dept.id);
                        return (
                          <div key={dept.id} className="border border-[#D7DEE7] rounded-[4px] overflow-hidden">
                            <div className="px-3 py-2 bg-[#F8FAFC] border-b border-[#E7ECF3] text-[11px] font-bold text-[#475569] uppercase tracking-[0.12em]">{dept.name}</div>
                            <div className="grid grid-cols-2 gap-2 p-3">
                              {deptBeds.slice(0, 4).map(bed => {
                                const p = patients.find(patient => patient.id === bed.currentPatientId);
                                const status = bed.status.toLowerCase();
                                return (
                                  <button
                                    key={bed.id}
                                    onClick={() => p && setActivePatientId(p.id)}
                                    className={`text-left rounded-[4px] border p-2 ${
                                      status === 'occupied'
                                        ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                                        : status === 'available'
                                        ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                                        : 'bg-[#FFFBEB] border-[#FCD34D]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-[#172033] text-[11px]">{bed.bedNumber}</span>
                                      <span className="text-[9px] uppercase tracking-[0.08em] font-semibold text-[#475569]">{status}</span>
                                    </div>
                                    <div className="text-[11px] font-semibold text-[#172033] truncate">{p ? `${p.lastName}, ${p.firstName}` : 'Available'}</div>
                                    <div className="text-[10px] text-[#64748B] font-mono mt-1">{p ? `NEWS2 ${observations.find(o => o.patientId === p.id)?.news2Score ?? 0}` : 'Ready for admission'}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <aside className="bg-white border border-[#D7DEE7] rounded-[6px] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E7ECF3] bg-[#F8FAFC]">
                    <h3 className="text-[12px] uppercase tracking-[0.14em] font-bold text-[#475569]">Priority patients</h3>
                  </div>
                  <div className="p-3 space-y-2">
                    {patients.slice(0, 5).map(p => {
                      const enc = encounters.find(e => e.patientId === p.id && e.status === 'ACTIVE');
                      const bed = beds.find(b => b.currentPatientId === p.id);
                      const obs = observations.find(o => o.patientId === p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActivePatientId(p.id);
                            setActiveView('chart');
                          }}
                          className="w-full text-left rounded-[4px] border border-[#E7ECF3] bg-[#F8FAFC] px-3 py-2 hover:border-[#BFDBFE] transition"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#172033] text-[12px]">{bed?.bedNumber || 'Ward'} • {p.lastName}, {p.firstName}</span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8]">NEWS2 {obs?.news2Score ?? 0}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-[#475569]">{enc?.admittingDiagnosis || 'Clinical review'}</div>
                          <div className="mt-1 text-[10px] text-[#64748B]">{obs ? `Last vitals ${new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Awaiting review'}</div>
                        </button>
                      );
                    })}
                  </div>
                </aside>
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
                <VitalsFlowsheet onOpenRecordModal={() => setIsVitalsEntryOpen(true)} />
              )}

              {/* SUB-TAB 2: DIAGNOSTIC LABS TABLE */}
              {chartSubTab === 'labs' && (
                <div className="bg-white rounded-bji border border-[#D7DEE7] overflow-hidden space-y-3">
                  <div className="p-3 border-b border-[#E7ECF3] flex flex-wrap items-center justify-between gap-2 bg-[#F8FAFC]">
                    <div className="flex items-center space-x-2.5">
                      <Microscope className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        Diagnostic Laboratory Biomarkers &amp; Chemistry Flowsheet
                      </h3>
                      <Badge variant="neutral" size="sm">{patientLabs.length} Panels</Badge>
                    </div>

                    {/* Filter by Category */}
                    <div className="flex items-center space-x-1 text-xs">
                      {['ALL', 'HEMATOLOGY', 'CHEMISTRY', 'CARDIAC', 'ENDOCRINE'].map(c => (
                        <button
                          key={c}
                          onClick={() => setLabFilter(c)}
                          className={`px-2 py-0.5 rounded-bji font-mono transition text-[10px] font-bold ${
                            labFilter === c 
                              ? 'bg-slate-900 text-white shadow-2xs' 
                              : 'bg-white border border-[#D7DEE7] text-slate-600 hover:bg-slate-50'
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
                          <th className="py-2.5 px-3">Test Assay / Biomarker</th>
                          <th className="py-2.5 px-3">Panel Category</th>
                          <th className="py-2.5 px-3">Observed Value</th>
                          <th className="py-2.5 px-3">Standard Reference Interval</th>
                          <th className="py-2.5 px-3">Acuity Flag</th>
                          <th className="py-2.5 px-3">Collection &amp; Result Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patientLabs
                          .filter(l => labFilter === 'ALL' || l.category === labFilter)
                          .map(lab => (
                            <tr key={lab.id} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                <div>{lab.testName}</div>
                                <span className="text-[10px] font-mono text-slate-400 font-normal">{lab.performingLab}</span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{lab.category}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 font-mono text-xs">
                                <span className={
                                  lab.flag === 'HIGH' || lab.flag === 'CRITICAL_HIGH' ? 'text-red-700' :
                                  lab.flag === 'LOW' || lab.flag === 'CRITICAL_LOW' ? 'text-amber-700' : 'text-emerald-700'
                                }>
                                  {lab.value}
                                </span>
                                <span className="font-normal text-slate-500 text-[11px] ml-1">{lab.unit}</span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                                {lab.referenceRange}
                              </td>
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
                              <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                                <div>Collected: {new Date(lab.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                <span className="text-[10px] text-slate-400">Resulted: {new Date(lab.resultedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                      {patientAdms.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-xs">No active medication administrations scheduled.</div>
                      ) : (
                        patientAdms.map(adm => {
                          const ord = orders.find(o => o.id === adm.orderId);
                          const isHighRisk = ord?.title.toLowerCase().includes("insulin") || 
                                             ord?.title.toLowerCase().includes("heparin") || 
                                             ord?.title.toLowerCase().includes("morphine");
                          return (
                            <div key={adm.id} className="p-2.5 rounded-bji border border-[#D7DEE7] bg-slate-50 flex items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{ord?.title || 'Medication'}</span>
                                  {isHighRisk && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
                                      High-Alert
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  Scheduled: {new Date(adm.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Route: {ord?.medicationDetails?.route || 'PO'} • Status: <strong className={
                                    adm.status === 'GIVEN' ? 'text-emerald-700' :
                                    adm.status === 'HELD' ? 'text-amber-700' :
                                    adm.status === 'REFUSED' ? 'text-red-700' : 'text-slate-700'
                                  }>{adm.status}</strong>
                                  {adm.administeredTime && ` at ${new Date(adm.administeredTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                  {adm.heldReason && ` (Reason: ${adm.heldReason})`}
                                  {adm.cosignedBy && ` (Cosigned: ${adm.cosignedBy})`}
                                </div>
                              </div>

                              <div>
                                {adm.status === 'NOT_GIVEN' ? (
                                  <button
                                    onClick={() => setSelectedAdminForDose({ adm, ord })}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-bji shadow-xs"
                                  >
                                    Record Dose
                                  </button>
                                ) : (
                                  <span className={`font-bold text-xs flex items-center gap-1 ${
                                    adm.status === 'GIVEN' ? 'text-emerald-700' :
                                    adm.status === 'HELD' ? 'text-amber-700' : 'text-red-700'
                                  }`}>
                                    {adm.status === 'GIVEN' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                    {adm.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
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
                    <div key={dept.id} className="bg-white rounded-[6px] border border-[#D7DEE7] p-4 space-y-3">
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
          {/* VIEW: ORDERS WORKSPACE                               */}
          {/* ==================================================== */}
          {(activeView === 'orders' || activeView === 'cpoe') && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-white p-3.5 rounded-[6px] border border-[#D7DEE7]">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Orders Workspace
                  </h2>
                  <p className="text-[11px] text-slate-500">Deterministic CDS review, verification flow, and clinician confirmation</p>
                </div>

                <button
                  onClick={() => setIsCpoeModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs"
                >
                  + Place CPOE Order
                </button>
              </div>

              <div className="bg-white rounded-[6px] border border-[#D7DEE7] overflow-hidden">
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

          {activeView === 'medications' && (
            <div className="space-y-4">
              <div className="bg-white p-3.5 rounded-bji border border-[#D7DEE7] flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Inpatient Medication Administration Record (eMAR)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Patient: <strong className="text-slate-800">{activePatient.lastName}, {activePatient.firstName}</strong> (MRN: {activePatient.mrn}) • 5-Rights Bedside Administration &amp; Dual Verification
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500">
                    {patientAdms.filter(a => a.status === 'GIVEN').length}/{patientAdms.length} Doses Given
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-bji border border-[#D7DEE7] p-4 space-y-3">
                {patientAdms.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No scheduled medication administrations found for this encounter.
                  </div>
                ) : (
                  patientAdms.map(adm => {
                    const order = orders.find(o => o.id === adm.orderId);
                    const isHighRisk = order?.title.toLowerCase().includes("insulin") || 
                                       order?.title.toLowerCase().includes("heparin") || 
                                       order?.title.toLowerCase().includes("morphine");
                    return (
                      <div key={adm.id} className="border border-[#D7DEE7] rounded-bji p-3 bg-slate-50 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{order?.title || 'Medication'}</span>
                            {isHighRisk && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
                                High-Risk Dual Sign
                              </span>
                            )}
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                              order?.status === 'DISPENSED' ? 'bg-emerald-100 text-emerald-800' :
                              order?.status === 'PHARMACY_VERIFIED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              Pharm: {order?.status || 'PENDING'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-1">
                            Scheduled: <strong>{new Date(adm.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> • Route: {order?.medicationDetails?.route || 'PO'} • Status: <strong className={
                              adm.status === 'GIVEN' ? 'text-emerald-700' :
                              adm.status === 'HELD' ? 'text-amber-700' :
                              adm.status === 'REFUSED' ? 'text-red-700' : 'text-slate-700'
                            }>{adm.status}</strong>
                            {adm.administeredTime && ` (Administered at ${new Date(adm.administeredTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                            {adm.heldReason && ` [Hold Reason: ${adm.heldReason}]`}
                            {adm.cosignedBy && ` [Cosigned by: ${adm.cosignedBy}]`}
                          </div>
                        </div>

                        <div>
                          {adm.status === 'NOT_GIVEN' ? (
                            <button
                              onClick={() => setSelectedAdminForDose({ adm, ord: order })}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-bji shadow-xs"
                            >
                              Administer Dose
                            </button>
                          ) : (
                            <span className={`font-bold text-xs flex items-center gap-1 ${
                              adm.status === 'GIVEN' ? 'text-emerald-700' :
                              adm.status === 'HELD' ? 'text-amber-700' : 'text-red-700'
                            }`}>
                              {adm.status === 'GIVEN' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                              {adm.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeView === 'pharmacy' && (
            <div className="space-y-4">
              <div className="bg-white p-3.5 rounded-bji border border-[#D7DEE7] flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Central Pharmacy Clinical Verification Queue
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Pharmacist Order Review: Allergy contraindications, DDIs, renal dose safety, and automated dispensing authorization
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                    Pharmacist Session: {currentStaff.name} ({currentStaff.role})
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-bji border border-[#D7DEE7] overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Patient &amp; MRN</th>
                      <th className="py-2.5 px-3">Prescribed Medication</th>
                      <th className="py-2.5 px-3">Documented Allergies</th>
                      <th className="py-2.5 px-3">CDS Intercepts / Priority</th>
                      <th className="py-2.5 px-3">Lifecycle Status</th>
                      <th className="py-2.5 px-3 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.filter(o => o.orderType === 'MEDICATION').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No active medication orders pending pharmacy review.
                        </td>
                      </tr>
                    ) : (
                      orders.filter(o => o.orderType === 'MEDICATION').map(order => {
                        const patient = patients.find(p => p.id === order.patientId);
                        const allergiesText = patient?.allergies && patient.allergies.length > 0
                          ? patient.allergies.map(a => `${a.allergen} (${a.reaction})`).join('; ')
                          : 'NKDA (No Known Drug Allergies)';
                        const hasCdsOverrides = order.cdsAlertsDismissed && order.cdsAlertsDismissed.length > 0;

                        return (
                          <tr key={order.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              <div>{patient ? `${patient.lastName}, ${patient.firstName}` : 'Unknown'}</div>
                              <span className="text-[10px] font-mono text-slate-500 font-normal">{patient?.mrn}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-800">{order.title}</span>
                              <p className="text-slate-500 text-[11px] font-mono">{order.description}</p>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <span className={patient?.allergies && patient.allergies.length > 0 ? 'text-red-700 font-semibold' : 'text-slate-500'}>
                                {allergiesText}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-col gap-0.5">
                                <span className={`text-[10px] font-mono font-bold ${order.priority === 'STAT' ? 'text-red-700' : 'text-slate-600'}`}>
                                  {order.priority}
                                </span>
                                {hasCdsOverrides && (
                                  <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>Override Documented</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                order.status === 'DISPENSED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                order.status === 'PHARMACY_VERIFIED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {order.status === 'ORDERED' && (
                                  <button
                                    onClick={() => verifyOrderPharmacy(order.id)}
                                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded shadow-xs"
                                  >
                                    Verify Safe
                                  </button>
                                )}
                                {order.status === 'PHARMACY_VERIFIED' && (
                                  <button
                                    onClick={() => dispenseOrderPharmacy(order.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded shadow-xs"
                                  >
                                    Dispense
                                  </button>
                                )}
                                {order.status === 'DISPENSED' && (
                                  <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Dispensed
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'imaging' && (
            <div className="space-y-4">
              <div className="bg-white p-3.5 rounded-bji border border-[#D7DEE7] flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Diagnostic PACS Radiology Worklist &amp; Studies
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Patient: <strong className="text-slate-800">{activePatient.lastName}, {activePatient.firstName}</strong> (MRN: {activePatient.mrn}) • Full DICOM Viewer with AI CAD Lesion Detection
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    PACS Worklist: {patientImaging.length} Studies
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patientImaging.length === 0 ? (
                  <div className="col-span-2 p-12 bg-white rounded-bji border border-[#D7DEE7] text-center text-slate-500 text-xs">
                    No diagnostic radiology studies found for this patient.
                  </div>
                ) : (
                  patientImaging.map(study => (
                    <div
                      key={study.id}
                      onClick={() => setSelectedStudyForPacs(study)}
                      className="bg-white rounded-bji border border-[#D7DEE7] p-3.5 hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex gap-3 group"
                    >
                      <div className="w-24 h-24 bg-black rounded overflow-hidden shrink-0 border border-slate-300 relative">
                        <img
                          src={study.imageThumbnailUrl}
                          alt={study.studyType}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold px-1 rounded bg-black/70 text-white">
                          {study.modality}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 truncate">{study.studyType}</span>
                            {study.isCriticalAlert && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
                                STAT
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            Acquired: {new Date(study.studyDate).toLocaleDateString()} • {study.bodySite}
                          </div>
                          <p className="text-slate-600 text-[11px] mt-1.5 line-clamp-2 leading-relaxed">
                            {study.impression}
                          </p>
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>CAD Overlays: {study.aiBoundingBoxes?.length || 0}</span>
                          <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
                            <span>Open in PACS</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: AMBIENT AI CLINICAL SCRIBE                     */}
          {/* ==================================================== */}
          {activeView === 'scribe' && (
            <AmbientScribeWorkspace />
          )}

          {/* ==================================================== */}
          {/* VIEW: OPERATING THEATRE / EXTERNAL OT BOARD          */}
          {/* ==================================================== */}
          {activeView === 'ot' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-[6px] border border-[#D7DEE7] flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-indigo-600" />
                    <span>Operating Theatre &amp; External Procedure Board</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">In-house OR schedule with satellite and external case coordination</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono bg-slate-100 border border-slate-200 rounded px-2 py-1">3 live rooms</span>
                  <button
                    onClick={() => setActiveView('operations')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded shadow-xs"
                  >
                    View emergency ops
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  ['Scheduled', '07:00', 'Reconciliation'],
                  ['In progress', '03', 'Live rooms'],
                  ['Satellite', '01', 'External transfer'],
                  ['Recovery', '14', 'PACU handoff']
                ].map(([label, value, sub]) => (
                  <div key={label} className="bg-white p-3.5 rounded-[6px] border border-[#D7DEE7]">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500 font-bold">{label}</div>
                    <div className="mt-2 text-[22px] font-bold text-slate-900">{value}</div>
                    <div className="text-[11px] text-slate-500">{sub}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
                <div className="bg-white rounded-[6px] border border-[#D7DEE7] p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E7ECF3] mb-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">External transfer network</h3>
                    <span className="text-[10px] font-mono text-slate-500">Satellite / mobile cases</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {[
                      ['Ambulatory imaging unit', 'Patient transfer ready • 07:45', 'green'],
                      ['Community cath lab', 'Transport team dispatched • 08:05', 'amber'],
                      ['Outreach ENT clinic', 'Procedure suite confirmed • 09:10', 'blue']
                    ].map(([title, detail, status]) => (
                      <div key={title} className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-slate-50 p-2.5">
                        <div>
                          <div className="font-bold text-slate-900">{title}</div>
                          <div className="text-[11px] text-slate-500">{detail}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          status === 'green' ? 'bg-emerald-100 text-emerald-800' :
                          status === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {status === 'green' ? 'READY' : status === 'amber' ? 'IN TRANSIT' : 'CONFIRMED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-[6px] border border-[#D7DEE7] p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E7ECF3] mb-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">Transfer controls</h3>
                    <Share2 className="w-4 h-4 text-indigo-600" />
                  </div>

                  <div className="space-y-3 text-xs">
                    <button className="w-full text-left p-2.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-800 font-semibold">
                      Launch external theatre checklist
                    </button>
                    <button className="w-full text-left p-2.5 rounded border border-slate-200 bg-slate-50 text-slate-700 font-medium">
                      Notify retrieval team and receiving unit
                    </button>
                    <button className="w-full text-left p-2.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold">
                      Confirm patient handoff documentation
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[6px] border border-[#D7DEE7] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E7ECF3] bg-[#F8FAFC] flex items-center justify-between">
                  <h3 className="text-[12px] uppercase tracking-[0.14em] font-bold text-[#475569]">Case docket</h3>
                  <span className="text-[11px] text-slate-500 font-mono">OR 01-06 • External transfer network</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Suite</th>
                        <th className="py-2.5 px-3">Patient</th>
                        <th className="py-2.5 px-3">Procedure</th>
                        <th className="py-2.5 px-3">Surgeon</th>
                        <th className="py-2.5 px-3">Anesthesia</th>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {otSchedule.map(caseItem => (
                        <tr key={caseItem.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">{caseItem.room}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{caseItem.patient}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{caseItem.mrn}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{caseItem.procedure}</div>
                            <div className="text-[10px] text-slate-500">{caseItem.specialty}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{caseItem.surgeon}</td>
                          <td className="py-2.5 px-3 text-slate-700">{caseItem.anesthetist}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{caseItem.time}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              caseItem.status === 'IN_PROGRESS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : caseItem.status === 'PREP'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {caseItem.external ? 'EXTERNAL' : caseItem.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* VIEW: OPERATIONS & EMERGENCY DRILLS                  */}
          {/* ==================================================== */}
          {activeView === 'operations' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-[6px] border border-[#D7DEE7] flex items-center justify-between">
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
              <div className="bg-white rounded-[6px] border border-[#D7DEE7] p-4 space-y-3">
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

          {/* ==================================================== */}
          {/* VIEW: FACILITY OPERATIONS & ADMIN                    */}
          {/* ==================================================== */}
          {activeView === 'facility_admin' && (
            <FacilityOperationsWorkspace />
          )}

          {/* ==================================================== */}
          {/* VIEW: PATIENT REGISTRY & GLOBAL EMPI                 */}
          {/* ==================================================== */}
          {activeView === 'registry' && (
            <PatientRegistryWorkspace />
          )}

          {/* ==================================================== */}
          {/* VIEW: EMERGENCY RESUSCITATION & TRAUMA BAY BOARD    */}
          {/* ==================================================== */}
          {(activeView === 'emergency' || activeView === 'trauma') && (
            <EmergencyWorkspace 
              onSelectPatientChart={(patId) => {
                setActivePatientId(patId);
                setActiveView('chart');
              }}
            />
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

      {/* QUICK INPATIENT VITALS ENTRY MODAL (NEWS2 ENGINE) */}
      <VitalsEntryModal
        isOpen={isVitalsEntryOpen}
        onClose={() => setIsVitalsEntryOpen(false)}
      />

      {/* eMAR BEDSIDE DOSE ADMINISTRATION MODAL */}
      <DoseAdministrationModal
        isOpen={!!selectedAdminForDose}
        onClose={() => setSelectedAdminForDose(null)}
        administration={selectedAdminForDose?.adm || null}
        order={selectedAdminForDose?.ord || null}
      />
    </div>
  );
};
