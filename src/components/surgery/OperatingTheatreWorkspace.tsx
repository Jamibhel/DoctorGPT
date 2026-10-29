"use client";

import React, { useState, useMemo } from "react";
import { useHospital } from "@/lib/state/hospital-store";
import { SurgicalCase, SurgicalCaseStatus } from "@/types/hospital";
import { WhoChecklistModal } from "./WhoChecklistModal";
import { IntraopRecordModal } from "./IntraopRecordModal";
import { ScheduleCaseModal } from "./ScheduleCaseModal";
import { 
  ShieldCheck, 
  Activity, 
  Clock, 
  Scissors, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Calendar, 
  Sparkles, 
  Search, 
  Filter, 
  FileCheck, 
  Droplet,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  UserCheck
} from "lucide-react";

export const OperatingTheatreWorkspace: React.FC = () => {
  const { surgicalCases, updateSurgicalCase } = useHospital();

  const [activeTab, setActiveTab] = useState<'suites' | 'schedule' | 'checklist' | 'counts'>('suites');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("ALL");
  const [selectedCaseForChecklist, setSelectedCaseForChecklist] = useState<SurgicalCase | null>(null);
  const [selectedCaseForIntraop, setSelectedCaseForIntraop] = useState<SurgicalCase | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);

  // High-level statistics
  const totalCases = surgicalCases.length;
  const inSurgeryCases = surgicalCases.filter(c => c.status === 'INTRA_OP' || c.status === 'CLOSING' || c.status === 'TIME_OUT');
  const inRecoveryCases = surgicalCases.filter(c => c.status === 'PACU_RECOVERY');
  
  // Checklist Compliance
  const completedChecklists = surgicalCases.filter(c => 
    c.checklist.signIn.patientConfirmed && 
    c.checklist.timeOut.verbalConfirmationPatientSiteProcedure
  ).length;
  const checklistCompliancePct = totalCases > 0 ? Math.round((completedChecklists / totalCases) * 100) : 100;

  // Counts Discrepancies
  const discrepancyCases = surgicalCases.filter(c => !c.intraoperative.countsReconciled);

  // Grouped by Operating Rooms
  const suitesList = [
    { room: "OR 1 (General/Trauma)", specialty: "General & Trauma Surgery", service: "Level 1 Trauma" },
    { room: "OR 2 (Orthopedics)", specialty: "Orthopedic Surgery & Arthroplasty", service: "Elective & Trauma" },
    { room: "OR 3 (Cardiac/Vascular)", specialty: "Cardiothoracic & Vascular", service: "Bypass / Valve / Hybrid" },
    { room: "OR 4 (Neurosurgery/Robotics)", specialty: "Neurosurgery & Robotic Navigation", service: "DaVinci Xi / Stealth" }
  ];

  const filteredCases = useMemo(() => {
    return surgicalCases.filter(c => {
      const matchesSearch = 
        c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.procedureName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.operatingRoom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.intraoperative.primarySurgeon.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty = specialtyFilter === "ALL" || c.specialty === specialtyFilter;
      return matchesSearch && matchesSpecialty;
    });
  }, [surgicalCases, searchQuery, specialtyFilter]);

  const handleStatusTransition = (caseId: string, nextStatus: SurgicalCaseStatus) => {
    updateSurgicalCase(caseId, { status: nextStatus });
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner / Operational Command */}
      <div className="bg-white p-4 rounded-bji border border-[#D7DEE7] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                Operating Theatre (OT) &amp; Perioperative Safety Board
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live Telemetry
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">
                WHO Surgical Safety Checklist • Intraoperative Anesthesia &amp; Fluid Telemetry • Sponge &amp; Needle Count Reconciliation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-bji shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Surgical Case</span>
          </button>
        </div>
      </div>

      {/* KPI Telemetry Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-bji border border-[#D7DEE7]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Active OR Suites</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">4 / 4</span>
            <span className="text-[10px] text-emerald-600 font-bold">100% Online</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Surgical Suites 01–04</div>
        </div>

        <div className="bg-white p-3 rounded-bji border border-[#D7DEE7]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Underway (Intra-Op)</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-700">{inSurgeryCases.length}</span>
            <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Live
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active Incision / Closing</div>
        </div>

        <div className="bg-white p-3 rounded-bji border border-[#D7DEE7]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">PACU Recovery</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-700">{inRecoveryCases.length}</span>
            <span className="text-[10px] text-purple-600 font-bold">Post-Op Care</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Extubated &amp; Monitoring</div>
        </div>

        <div className="bg-white p-3 rounded-bji border border-[#D7DEE7]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">WHO Checklist Gate</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">{checklistCompliancePct}%</span>
            <span className="text-[10px] text-emerald-600 font-bold">Attested</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sign In &amp; Time Out Gates</div>
        </div>

        <div className="bg-white p-3 rounded-bji border border-[#D7DEE7] col-span-2 md:col-span-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Count Discrepancies</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${discrepancyCases.length > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {discrepancyCases.length}
            </span>
            <span className={`text-[10px] font-bold ${discrepancyCases.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {discrepancyCases.length > 0 ? 'ACTION REQUIRED' : 'Reconciled'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sponges, Needles, Instruments</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-[#D7DEE7] bg-white rounded-t-bji px-2 pt-2 gap-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('suites')}
          className={`py-2 px-3.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'suites'
              ? 'border-emerald-600 text-emerald-800 font-bold bg-emerald-50/40 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>OR Suite Turnover &amp; Live Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`py-2 px-3.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'schedule'
              ? 'border-emerald-600 text-emerald-800 font-bold bg-emerald-50/40 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Case Schedule Docket ({surgicalCases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`py-2 px-3.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'checklist'
              ? 'border-emerald-600 text-emerald-800 font-bold bg-emerald-50/40 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>WHO Surgical Safety Protocol</span>
        </button>

        <button
          onClick={() => setActiveTab('counts')}
          className={`py-2 px-3.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'counts'
              ? 'border-emerald-600 text-emerald-800 font-bold bg-emerald-50/40 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scissors className="w-4 h-4 text-purple-600" />
          <span>Count Reconciliation &amp; Fluid Telemetry</span>
          {discrepancyCases.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          )}
        </button>
      </div>

      {/* VIEW 1: SUITES TURNOVER & LIVE TIMELINE */}
      {activeTab === 'suites' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {suitesList.map((suite, idx) => {
              const liveCase = surgicalCases.find(c => c.operatingRoom.includes(`OR ${idx + 1}`));
              const isUnderway = liveCase?.status === 'INTRA_OP' || liveCase?.status === 'CLOSING';
              const isTimeOut = liveCase?.status === 'TIME_OUT';
              const isPreOp = liveCase?.status === 'PRE_OP' || liveCase?.status === 'IN_ROOM';
              const isPacu = liveCase?.status === 'PACU_RECOVERY';
              const isCompleted = liveCase?.status === 'COMPLETED';

              return (
                <div key={suite.room} className="bg-white rounded-bji border border-[#D7DEE7] p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    {/* Suite Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#E7ECF3]">
                      <div>
                        <div className="font-bold text-xs text-slate-900 font-mono flex items-center gap-1.5">
                          <span>{suite.room}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{suite.specialty}</div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isUnderway ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' :
                        isTimeOut ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        isPreOp ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        isPacu ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {liveCase?.status || 'VACANT'}
                      </span>
                    </div>

                    {/* Suite Body */}
                    {liveCase ? (
                      <div className="mt-3 space-y-2 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{liveCase.patientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            MRN: {liveCase.mrn} • ASA: <strong className="text-slate-800">{liveCase.intraoperative.asaScore}</strong>
                          </div>
                        </div>

                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                          <div className="font-semibold text-slate-800 text-[11px]">{liveCase.procedureName}</div>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                            <span>Surgeon: <strong>{liveCase.intraoperative.primarySurgeon}</strong></span>
                            <span>{liveCase.estimatedDurationMinutes}m</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Anesthesia: {liveCase.intraoperative.anesthesiologist}
                          </div>
                        </div>

                        {/* WHO Checklist Progress Indicator */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>WHO Checklist Gates:</span>
                            <span className="font-mono">
                              {liveCase.checklist.signIn.patientConfirmed ? '✓ Sign-In ' : '○ Sign-In '}
                              {liveCase.checklist.timeOut.verbalConfirmationPatientSiteProcedure ? '✓ Time-Out ' : '○ Time-Out '}
                              {liveCase.checklist.signOut.instrumentCountsCorrect ? '✓ Sign-Out' : '○ Sign-Out'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                            <div className={`h-full ${liveCase.checklist.signIn.patientConfirmed ? 'bg-emerald-500 w-1/3' : 'bg-transparent'}`} />
                            <div className={`h-full ${liveCase.checklist.timeOut.verbalConfirmationPatientSiteProcedure ? 'bg-blue-500 w-1/3' : 'bg-transparent'}`} />
                            <div className={`h-full ${liveCase.checklist.signOut.instrumentCountsCorrect ? 'bg-purple-500 w-1/3' : 'bg-transparent'}`} />
                          </div>
                        </div>

                        {/* Suite Turnover Countdown (if cleaning) */}
                        {liveCase.turnoverMinutesRemaining !== undefined && (
                          <div className="p-2 bg-amber-50 rounded border border-amber-200 flex items-center justify-between text-[10px] text-amber-900">
                            <span className="flex items-center gap-1 font-bold">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              Turnover Cleaning:
                            </span>
                            <span className="font-mono font-bold">{liveCase.turnoverMinutesRemaining} min remaining</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No active surgical case assigned to this theatre.
                      </div>
                    )}
                  </div>

                  {/* Suite Quick Actions */}
                  {liveCase && (
                    <div className="mt-4 pt-3 border-t border-[#E7ECF3] flex flex-col gap-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => setSelectedCaseForChecklist(liveCase)}
                          className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded border border-blue-200 flex items-center justify-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Checklist</span>
                        </button>
                        <button
                          onClick={() => setSelectedCaseForIntraop(liveCase)}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded border border-slate-200 flex items-center justify-center gap-1"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Intra-Op</span>
                        </button>
                      </div>

                      {/* Rapid Status Transition Button */}
                      <div className="flex items-center gap-1">
                        {liveCase.status === 'PRE_OP' && (
                          <button
                            onClick={() => handleStatusTransition(liveCase.id, 'TIME_OUT')}
                            className="w-full py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded"
                          >
                            Advance to Time Out
                          </button>
                        )}
                        {liveCase.status === 'TIME_OUT' && (
                          <button
                            onClick={() => handleStatusTransition(liveCase.id, 'INTRA_OP')}
                            className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded"
                          >
                            Begin Incision (Intra-Op)
                          </button>
                        )}
                        {liveCase.status === 'INTRA_OP' && (
                          <button
                            onClick={() => handleStatusTransition(liveCase.id, 'CLOSING')}
                            className="w-full py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded"
                          >
                            Commence Closure
                          </button>
                        )}
                        {liveCase.status === 'CLOSING' && (
                          <button
                            onClick={() => handleStatusTransition(liveCase.id, 'PACU_RECOVERY')}
                            className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded"
                          >
                            Transfer to PACU Recovery
                          </button>
                        )}
                        {liveCase.status === 'PACU_RECOVERY' && (
                          <button
                            onClick={() => handleStatusTransition(liveCase.id, 'COMPLETED')}
                            className="w-full py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] rounded"
                          >
                            Discharge / Complete Case
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: CASE SCHEDULE DOCKET */}
      {activeTab === 'schedule' && (
        <div className="space-y-3">
          {/* Filters Bar */}
          <div className="bg-white p-3 rounded-bji border border-[#D7DEE7] flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, MRN, procedure, surgeon, or OR suite..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-slate-500 font-medium">Specialty:</span>
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded p-1.5 bg-white font-semibold"
              >
                <option value="ALL">All Specialties</option>
                <option value="GENERAL">General</option>
                <option value="ORTHO">Orthopedics</option>
                <option value="CARDIAC">Cardiothoracic</option>
                <option value="NEURO">Neurosurgery</option>
                <option value="UROLOGY">Urology</option>
                <option value="ENT">ENT</option>
                <option value="PLASTICS">Plastics</option>
              </select>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-white rounded-bji border border-[#D7DEE7] overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Suite &amp; Scheduled Time</th>
                  <th className="py-2.5 px-3">Patient &amp; MRN</th>
                  <th className="py-2.5 px-3">Procedure &amp; Specialty</th>
                  <th className="py-2.5 px-3">Surgical Team</th>
                  <th className="py-2.5 px-3">WHO Checklist</th>
                  <th className="py-2.5 px-3">Count Verification</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No surgical cases match current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map(c => {
                    const isSignInDone = c.checklist.signIn.patientConfirmed;
                    const isTimeOutDone = c.checklist.timeOut.verbalConfirmationPatientSiteProcedure;
                    const isSignOutDone = c.checklist.signOut.instrumentCountsCorrect;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono">
                          <strong className="text-slate-900 block">{c.operatingRoom}</strong>
                          <span className="text-[10px] text-slate-500">
                            {new Date(c.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({c.estimatedDurationMinutes}m)
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <strong className="text-slate-900 block">{c.patientName}</strong>
                          <span className="text-[10px] font-mono text-slate-500">MRN: {c.mrn}</span>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800">{c.procedureName}</span>
                          <span className="text-[10px] block text-slate-500">{c.specialty}</span>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="text-slate-800 font-medium">Surgeon: {c.intraoperative.primarySurgeon}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Anes: {c.intraoperative.anesthesiologist} ({c.intraoperative.asaScore})</div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 font-mono text-[9px] font-bold">
                            <span className={`px-1.5 py-0.5 rounded ${isSignInDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                              Sign-In {isSignInDone ? '✓' : '○'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded ${isTimeOutDone ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                              Time-Out {isTimeOutDone ? '✓' : '○'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded ${isSignOutDone ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'}`}>
                              Sign-Out {isSignOutDone ? '✓' : '○'}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          {c.intraoperative.countsReconciled ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">
                              RECONCILED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              DISCREPANCY
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            c.status === 'INTRA_OP' ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' :
                            c.status === 'TIME_OUT' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            c.status === 'CLOSING' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                            c.status === 'PACU_RECOVERY' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            c.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {c.status}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCaseForChecklist(c)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded border border-blue-200"
                            >
                              Checklist
                            </button>
                            <button
                              onClick={() => setSelectedCaseForIntraop(c)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded border border-slate-200"
                            >
                              Intra-Op
                            </button>
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

      {/* VIEW 3: WHO CHECKLIST COMPLIANCE MONITOR */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-bji border border-[#D7DEE7] flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                WHO 3-Phase Perioperative Safety Protocol Monitor
              </h2>
              <p className="text-[11px] text-slate-500">
                Mandatory verbal pause before anesthesia induction (Sign In), skin incision (Time Out), and room transfer (Sign Out)
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded">
              Institutional Compliance: {checklistCompliancePct}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {surgicalCases.map(c => {
              const sign = c.checklist.signIn;
              const tout = c.checklist.timeOut;
              const sout = c.checklist.signOut;

              return (
                <div key={c.id} className="bg-white rounded-bji border border-[#D7DEE7] p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E7ECF3]">
                    <div>
                      <strong className="text-slate-900 text-xs block">{c.patientName} ({c.mrn})</strong>
                      <span className="text-[11px] text-slate-500">{c.operatingRoom} • {c.procedureName}</span>
                    </div>
                    <button
                      onClick={() => setSelectedCaseForChecklist(c)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded shadow-xs"
                    >
                      Run Checklist
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Phase 1 */}
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          {sign.patientConfirmed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          <span>Phase 1: Sign In</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Identity, site mark, pulse oximetry, and allergy verification
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${sign.patientConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {sign.verifiedAt ? `Verified: ${new Date(sign.verifiedAt).toLocaleTimeString()}` : 'PENDING'}
                      </span>
                    </div>

                    {/* Phase 2 */}
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          {tout.verbalConfirmationPatientSiteProcedure ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          <span>Phase 2: Time Out</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Team intro, verbal confirm, sterility check, antibiotic: <strong>{tout.antibioticGivenName || 'None'}</strong>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${tout.verbalConfirmationPatientSiteProcedure ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'}`}>
                        {tout.verifiedAt ? `Verified: ${new Date(tout.verifiedAt).toLocaleTimeString()}` : 'PENDING'}
                      </span>
                    </div>

                    {/* Phase 3 */}
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          {sout.instrumentCountsCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          <span>Phase 3: Sign Out</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Procedure recorded, counts reconciled, specimen labeled aloud
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${sout.instrumentCountsCorrect ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'}`}>
                        {sout.verifiedAt ? `Verified: ${new Date(sout.verifiedAt).toLocaleTimeString()}` : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 4: SURGICAL COUNT RECONCILIATION & FLUID TELEMETRY */}
      {activeTab === 'counts' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-bji border border-[#D7DEE7] flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Surgical Counts Reconciliation &amp; Fluid Hemodynamics Console
              </h2>
              <p className="text-[11px] text-slate-500">
                Retained Surgical Item (RSI) prevention telemetry, sponge/needle/instrument balance, and fluid balance
              </p>
            </div>
            {discrepancyCases.length > 0 ? (
              <span className="text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-300 px-2 py-1 rounded flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                {discrepancyCases.length} CASE HAS COUNT DISCREPANCY
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ALL ACTIVE THEATRES RECONCILED
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {surgicalCases.map(c => {
              const rec = c.intraoperative;
              const netBalance = (rec.crystalloidsMl + rec.colloidsMl) - (rec.eblMl + rec.urineOutputMl);
              const spongeBalanced = rec.spongeCountFinal === (rec.spongeCountInitial + rec.spongeCountAdded);
              const needleBalanced = rec.needleCountFinal === (rec.needleCountInitial + rec.needleCountAdded);
              const instrumentBalanced = rec.instrumentCountFinal === rec.instrumentCountInitial;

              return (
                <div key={c.id} className="bg-white rounded-bji border border-[#D7DEE7] p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E7ECF3]">
                    <div>
                      <strong className="text-slate-900 text-xs block">{c.patientName} ({c.mrn})</strong>
                      <span className="text-[11px] text-slate-500">{c.operatingRoom} • {c.procedureName}</span>
                    </div>
                    <button
                      onClick={() => setSelectedCaseForIntraop(c)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded shadow-xs"
                    >
                      Update Counts &amp; Fluids
                    </button>
                  </div>

                  {/* Counts Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className={`p-2 rounded border text-center ${spongeBalanced ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-300 text-red-900'}`}>
                      <div className="text-[10px] text-slate-500">Sponges / Laps</div>
                      <div className="font-mono font-bold text-sm mt-0.5">
                        {rec.spongeCountFinal} / {rec.spongeCountInitial + rec.spongeCountAdded}
                      </div>
                      <span className={`text-[9px] font-bold ${spongeBalanced ? 'text-emerald-700' : 'text-red-700'}`}>
                        {spongeBalanced ? 'Reconciled' : 'DISCREPANCY'}
                      </span>
                    </div>

                    <div className={`p-2 rounded border text-center ${needleBalanced ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-300 text-red-900'}`}>
                      <div className="text-[10px] text-slate-500">Needles / Sharps</div>
                      <div className="font-mono font-bold text-sm mt-0.5">
                        {rec.needleCountFinal} / {rec.needleCountInitial + rec.needleCountAdded}
                      </div>
                      <span className={`text-[9px] font-bold ${needleBalanced ? 'text-emerald-700' : 'text-red-700'}`}>
                        {needleBalanced ? 'Reconciled' : 'DISCREPANCY'}
                      </span>
                    </div>

                    <div className={`p-2 rounded border text-center ${instrumentBalanced ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-300 text-red-900'}`}>
                      <div className="text-[10px] text-slate-500">Instruments</div>
                      <div className="font-mono font-bold text-sm mt-0.5">
                        {rec.instrumentCountFinal} / {rec.instrumentCountInitial}
                      </div>
                      <span className={`text-[9px] font-bold ${instrumentBalanced ? 'text-emerald-700' : 'text-red-700'}`}>
                        {instrumentBalanced ? 'Reconciled' : 'DISCREPANCY'}
                      </span>
                    </div>
                  </div>

                  {/* Fluid Balance Bar */}
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500">Estimated Blood Loss &amp; Urine:</div>
                      <div className="font-mono text-slate-800 font-bold">
                        EBL: {rec.eblMl} mL • Urine: {rec.urineOutputMl} mL
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">Net Fluid Balance:</div>
                      <span className={`font-mono font-bold text-xs ${netBalance >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {netBalance > 0 ? `+${netBalance}` : netBalance} mL
                      </span>
                    </div>
                  </div>

                  {/* Transfer Destination */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono pt-1">
                    <span>Destination: <strong>{rec.postOpDestination}</strong></span>
                    <span>Transfusion: {rec.bloodProductsTransfused}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODALS */}
      {selectedCaseForChecklist && (
        <WhoChecklistModal
          surgicalCase={selectedCaseForChecklist}
          isOpen={true}
          onClose={() => setSelectedCaseForChecklist(null)}
        />
      )}

      {selectedCaseForIntraop && (
        <IntraopRecordModal
          surgicalCase={selectedCaseForIntraop}
          isOpen={true}
          onClose={() => setSelectedCaseForIntraop(null)}
        />
      )}

      <ScheduleCaseModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />

    </div>
  );
};
