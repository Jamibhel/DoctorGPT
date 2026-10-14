"use client";

import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Activity, 
  Zap, 
  Heart, 
  Clock, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  Stethoscope, 
  CheckSquare, 
  Plus, 
  Check, 
  AlertOctagon, 
  RefreshCw,
  FileText,
  Bed,
  Users,
  Ambulance,
  Radio,
  Timer,
  ChevronRight,
  Flame,
  ArrowRight,
  UserPlus
} from "lucide-react";
import { 
  TraumaBay, 
  DoorToMetric, 
  ResuscitationRecord, 
  ResuscitationRhythm,
  ReversibleCausesState,
  MciPatientTag,
  MciTriageCategory,
  EmergencyCodeType
} from "@/types/hospital";
import { useHospital } from "@/lib/state/hospital-store";
import { useSession } from "@/lib/auth/session-context";
import { Button, Badge } from "@/components/ui";
import { CodeBlueTrackerModal } from "./CodeBlueTrackerModal";

export const EmergencyWorkspace: React.FC<{
  onSelectPatientChart?: (patientId: string) => void;
}> = ({ onSelectPatientChart }) => {
  const { 
    activeFacilityId,
    traumaBays, 
    doorToMetrics, 
    resuscitations, 
    mciTags, 
    updateTraumaBay,
    recordResuscitationEvent,
    recordMciTag,
    triggerEmergencyCode,
    activeEmergency,
    patients,
    setActivePatientId,
    staff
  } = useHospital();
  const { currentUser } = useSession();

  // Active workspace tab: 'trauma_bays' | 'code_blue' | 'mci_disaster'
  const [activeTab, setActiveTab] = useState<'trauma_bays' | 'code_blue' | 'mci_disaster'>('trauma_bays');

  // Code Blue modal trigger
  const [isCodeBlueModalOpen, setIsCodeBlueModalOpen] = useState(false);
  const [codeBlueTargetPatientId, setCodeBlueTargetPatientId] = useState<string | undefined>(undefined);
  const [isDrillModeActive, setIsDrillModeActive] = useState(false);

  // Quick Triage Intake Modal
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [selectedBayForIntake, setSelectedBayForIntake] = useState<TraumaBay | null>(null);
  const [intakeFormData, setIntakeFormData] = useState({
    patientName: "",
    mrn: "",
    acuity: 2 as 1 | 2 | 3 | 4 | 5,
    chiefComplaint: "",
    attendingPhysician: currentUser?.name || "Dr. Gregory House, MD",
    primaryNurse: "Staff RN",
    activeCode: "" as "" | EmergencyCodeType
  });

  // Rapid START Triage Form state
  const [mciForm, setMciForm] = useState({
    disasterCode: "MCI-HIGHWAY-77",
    tagNumber: `MCI-${Math.floor(100 + Math.random() * 900)}`,
    estimatedAgeGroup: "ADULT" as "PEDIATRIC" | "ADULT" | "GERIATRIC",
    gender: "MALE" as "MALE" | "FEMALE" | "UNKNOWN",
    chiefInjuries: "",
    isAmbulatory: false,
    spontaneousBreathing: true,
    respiratoryRate: 24,
    hasRadialPulse: true,
    followsCommands: true,
    assignedBayId: ""
  });

  // Calculate START triage category automatically
  const computedMciCategory = (): MciTriageCategory => {
    if (mciForm.isAmbulatory) return 'GREEN_MINOR';
    if (!mciForm.spontaneousBreathing) return 'BLACK_EXPECTANT';
    if (mciForm.respiratoryRate > 30 || mciForm.respiratoryRate < 10) return 'RED_IMMEDIATE';
    if (!mciForm.hasRadialPulse) return 'RED_IMMEDIATE';
    if (!mciForm.followsCommands) return 'RED_IMMEDIATE';
    return 'YELLOW_DELAYED';
  };

  const handleCreateMciTag = (e: React.FormEvent) => {
    e.preventDefault();
    const category = computedMciCategory();
    recordMciTag({
      disasterCode: mciForm.disasterCode,
      tagNumber: mciForm.tagNumber,
      triageCategory: category,
      estimatedAgeGroup: mciForm.estimatedAgeGroup,
      gender: mciForm.gender,
      chiefInjuries: mciForm.chiefInjuries || "Trauma casualties requiring evaluation",
      isAmbulatory: mciForm.isAmbulatory,
      spontaneousBreathing: mciForm.spontaneousBreathing,
      respiratoryRate: mciForm.respiratoryRate,
      hasRadialPulse: mciForm.hasRadialPulse,
      followsCommands: mciForm.followsCommands,
      assignedBayId: mciForm.assignedBayId || undefined,
      taggedBy: currentUser?.name || "Triage Officer"
    });

    // Reset form
    setMciForm({
      disasterCode: "MCI-HIGHWAY-77",
      tagNumber: `MCI-${Math.floor(100 + Math.random() * 900)}`,
      estimatedAgeGroup: "ADULT",
      gender: "MALE",
      chiefInjuries: "",
      isAmbulatory: false,
      spontaneousBreathing: true,
      respiratoryRate: 24,
      hasRadialPulse: true,
      followsCommands: true,
      assignedBayId: ""
    });
  };

  const handleOpenIntake = (bay: TraumaBay) => {
    setSelectedBayForIntake(bay);
    setIntakeFormData({
      patientName: "",
      mrn: `BJI-ED-${Math.floor(1000 + Math.random() * 9000)}`,
      acuity: bay.acuity,
      chiefComplaint: "",
      attendingPhysician: currentUser?.name || "Dr. Gregory House, MD",
      primaryNurse: "Staff RN",
      activeCode: ""
    });
    setIsIntakeModalOpen(true);
  };

  const handleSaveIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBayForIntake) return;

    updateTraumaBay(selectedBayForIntake.id, {
      status: 'OCCUPIED',
      patientName: intakeFormData.patientName || "Unidentified Trauma Patient",
      mrn: intakeFormData.mrn,
      acuity: intakeFormData.acuity,
      chiefComplaint: intakeFormData.chiefComplaint,
      attendingPhysician: intakeFormData.attendingPhysician,
      primaryNurse: intakeFormData.primaryNurse,
      arrivalTime: new Date().toISOString(),
      activeCode: intakeFormData.activeCode ? intakeFormData.activeCode : undefined
    });

    if (intakeFormData.activeCode) {
      triggerEmergencyCode(
        intakeFormData.activeCode as any,
        `${selectedBayForIntake.bayNumber} - ${selectedBayForIntake.name}`
      );
    }

    setIsIntakeModalOpen(false);
  };

  const handleDischargeBay = (bayId: string) => {
    updateTraumaBay(bayId, {
      status: 'AVAILABLE',
      patientId: undefined,
      patientName: undefined,
      mrn: undefined,
      chiefComplaint: undefined,
      activeCode: undefined
    });
  };

  const handleTriggerCodeBlueForBay = (bay: TraumaBay) => {
    updateTraumaBay(bay.id, {
      activeCode: 'CODE_BLUE'
    });
    triggerEmergencyCode('CODE_BLUE', `${bay.bayNumber} - ${bay.name}`);
    setCodeBlueTargetPatientId(bay.patientId);
    setIsDrillModeActive(false);
    setIsCodeBlueModalOpen(true);
  };

  const occupiedBaysCount = traumaBays.filter(b => b.status === 'OCCUPIED').length;

  return (
    <div className="flex-1 flex flex-col bg-bji-slate-50 overflow-y-auto">
      {/* 1. TOP HEADER & TELEMETRY STRIP */}
      <div className="bg-white border-b border-bji-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-bji bg-bji-red-600 flex items-center justify-center text-white shadow-xs">
            <Ambulance className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-bji-slate-900 tracking-tight">
                Emergency Department &amp; Trauma Resuscitation Board
              </h1>
              <Badge tone="danger" size="xs">STAT LEVEL-1</Badge>
            </div>
            <p className="text-xs text-bji-slate-500">
              Real-time trauma bay telemetry, Door-to-Balloon/Needle benchmarks, ACLS Code Blue engine, and MCI disaster triage.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCodeBlueTargetPatientId(undefined);
              setIsDrillModeActive(true);
              setIsCodeBlueModalOpen(true);
            }}
            className="border-amber-500 text-amber-700 hover:bg-amber-50 text-xs font-semibold"
          >
            <Radio className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            Code Blue Drill (Sim)
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setCodeBlueTargetPatientId(undefined);
              setIsDrillModeActive(false);
              setIsCodeBlueModalOpen(true);
            }}
            className="text-xs font-bold shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Active Resuscitation Console
          </Button>
        </div>
      </div>

      {/* 2. DOOR-TO-METRIC BENCHMARKS BANNER */}
      <div className="bg-bji-slate-900 text-white px-4 py-2.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs border-b border-bji-slate-800">
        {/* Door-to-Balloon (STEMI) */}
        {doorToMetrics.filter(m => m.type === 'DOOR_TO_BALLOON').map(metric => (
          <div key={metric.id} className="bg-bji-slate-950 p-2.5 rounded border border-bji-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-bji-red-400 font-bold uppercase">
                <Heart className="w-3.5 h-3.5 text-bji-red-400" />
                Door-to-Balloon (STEMI)
              </div>
              <div className="text-[11px] text-bji-slate-300 font-medium truncate max-w-[160px]">
                {metric.patientName} ({metric.mrn})
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-bold text-white">
                {metric.currentElapsedMinutes}m / {metric.targetMinutes}m
              </div>
              <span className="text-[10px] font-mono text-bji-green-400 font-semibold">
                ● {metric.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}

        {/* Door-to-Needle (Stroke) */}
        {doorToMetrics.filter(m => m.type === 'DOOR_TO_NEEDLE').map(metric => (
          <div key={metric.id} className="bg-bji-slate-950 p-2.5 rounded border border-bji-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-bji-blue-400 font-bold uppercase">
                <Activity className="w-3.5 h-3.5 text-bji-blue-400" />
                Door-to-Needle (Stroke)
              </div>
              <div className="text-[11px] text-bji-slate-300 font-medium truncate max-w-[160px]">
                {metric.patientName} ({metric.mrn})
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-bold text-white">
                {metric.currentElapsedMinutes}m / {metric.targetMinutes}m
              </div>
              <span className="text-[10px] font-mono text-bji-green-400 font-semibold">
                ● {metric.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        ))}

        {/* ED Resus Census */}
        <div className="bg-bji-slate-950 p-2.5 rounded border border-bji-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-bji-slate-400 uppercase font-bold">
              Resuscitation Bays Census
            </div>
            <div className="text-sm font-bold text-white">
              {occupiedBaysCount} Occupied / {traumaBays.length} Total
            </div>
          </div>
          <Badge tone={occupiedBaysCount >= 5 ? "danger" : "success"} size="xs">
            {traumaBays.length - occupiedBaysCount} Available
          </Badge>
        </div>

        {/* Disaster Status */}
        <div className="bg-bji-slate-950 p-2.5 rounded border border-bji-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Disaster Protocol
            </div>
            <div className="text-sm font-bold text-white">
              Highway 77 Multi-Vehicle
            </div>
          </div>
          <Badge tone="warning" size="xs">MCI ACTIVE</Badge>
        </div>
      </div>

      {/* 3. WORKSPACE TABS */}
      <div className="bg-white border-b border-bji-slate-200 px-4 flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('trauma_bays')}
          className={`py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'trauma_bays'
              ? "border-bji-red-600 text-bji-red-700"
              : "border-transparent text-bji-slate-600 hover:text-bji-slate-900"
          }`}
        >
          <Bed className="w-3.5 h-3.5" />
          <span>Trauma Bay Resuscitation Grid ({traumaBays.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('code_blue')}
          className={`py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'code_blue'
              ? "border-bji-red-600 text-bji-red-700"
              : "border-transparent text-bji-slate-600 hover:text-bji-slate-900"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-bji-red-500" />
          <span>Code Blue ACLS Engine &amp; Tracker</span>
          <span className="w-2 h-2 rounded-full bg-bji-red-500 animate-pulse" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mci_disaster')}
          className={`py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'mci_disaster'
              ? "border-bji-red-600 text-bji-red-700"
              : "border-transparent text-bji-slate-600 hover:text-bji-slate-900"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Mass Casualty Incident (START / SALT)</span>
          <Badge tone="danger" size="xs" variant="subtle">{mciTags.length} Tagged</Badge>
        </button>
      </div>

      {/* 4. MAIN CONTENT PANELS */}
      <div className="flex-1 p-4 max-w-7xl mx-auto w-full">
        
        {/* ============================================================ */}
        {/* TAB 1: TRAUMA BAY RESUSCITATION GRID                         */}
        {/* ============================================================ */}
        {activeTab === 'trauma_bays' && (
          <div className="space-y-4">
            {/* Bay Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {traumaBays.map((bay) => {
                const isOccupied = bay.status === 'OCCUPIED';
                const hasActiveCode = !!bay.activeCode;

                return (
                  <div 
                    key={bay.id} 
                    className={`bg-white rounded-bji border shadow-2xs transition-all overflow-hidden flex flex-col justify-between ${
                      hasActiveCode 
                        ? "border-bji-red-600 ring-2 ring-bji-red-400" 
                        : isOccupied 
                          ? "border-bji-slate-300" 
                          : "border-dashed border-bji-slate-300 bg-bji-slate-50/50"
                    }`}
                  >
                    {/* Bay Card Header */}
                    <div className={`p-3 border-b flex items-center justify-between ${
                      hasActiveCode 
                        ? "bg-bji-red-600 text-white" 
                        : "bg-bji-slate-50 border-bji-slate-200"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                          hasActiveCode ? "bg-white text-bji-red-700" : "bg-bji-slate-200 text-bji-slate-800"
                        }`}>
                          {bay.bayNumber}
                        </span>
                        <span className={`text-xs font-semibold ${hasActiveCode ? "text-white" : "text-bji-slate-900"}`}>
                          {bay.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hasActiveCode && (
                          <span className="bg-white text-bji-red-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                            {bay.activeCode?.replace('_', ' ')}
                          </span>
                        )}
                        <Badge 
                          tone={isOccupied ? "danger" : bay.status === 'AVAILABLE' ? "success" : "neutral"} 
                          size="xs"
                        >
                          {bay.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Bay Card Body */}
                    <div className="p-3.5 space-y-2.5 flex-1">
                      {isOccupied ? (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-xs font-bold text-bji-slate-900 flex items-center gap-1.5">
                                <span>{bay.patientName}</span>
                                {bay.mrn && (
                                  <span className="font-mono text-[11px] text-bji-slate-500 font-normal">
                                    ({bay.mrn})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-bji-slate-600 mt-0.5">
                                <strong>Chief:</strong> {bay.chiefComplaint || "Acute emergent condition"}
                              </div>
                            </div>

                            {/* Acuity Pill */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              bay.acuity === 1 ? "bg-bji-red-100 text-bji-red-800 border border-bji-red-300" :
                              bay.acuity === 2 ? "bg-amber-100 text-amber-800 border border-amber-300" :
                              bay.acuity === 3 ? "bg-yellow-100 text-yellow-800 border border-yellow-300" :
                              "bg-bji-green-100 text-bji-green-800 border border-bji-green-300"
                            }`}>
                              ESI Level {bay.acuity}
                            </span>
                          </div>

                          {/* Staff assignments */}
                          <div className="pt-2 border-t border-bji-slate-100 grid grid-cols-2 gap-1 text-[11px]">
                            <div>
                              <span className="text-bji-slate-400 block text-[10px] uppercase font-mono">Attending</span>
                              <span className="font-semibold text-bji-slate-800">{bay.attendingPhysician || "Unassigned"}</span>
                            </div>
                            <div>
                              <span className="text-bji-slate-400 block text-[10px] uppercase font-mono">Primary Nurse</span>
                              <span className="font-semibold text-bji-slate-800">{bay.primaryNurse || "Unassigned"}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-6 text-center text-bji-slate-400 space-y-2">
                          <Bed className="w-8 h-8 mx-auto opacity-40" />
                          <div className="text-xs">Bay is vacant and prepared for intake.</div>
                        </div>
                      )}
                    </div>

                    {/* Bay Card Footer Actions */}
                    <div className="p-2.5 bg-bji-slate-50 border-t border-bji-slate-200 flex items-center justify-between gap-1.5">
                      {isOccupied ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={() => handleTriggerCodeBlueForBay(bay)}
                              className="text-[11px] font-bold"
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Code Blue
                            </Button>

                            {bay.patientId && onSelectPatientChart && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => {
                                  setActivePatientId(bay.patientId!);
                                  onSelectPatientChart(bay.patientId!);
                                }}
                                className="text-[11px]"
                              >
                                Chart
                              </Button>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleDischargeBay(bay.id)}
                            className="text-bji-slate-500 hover:text-bji-red-600 text-[11px]"
                          >
                            Clear Bay
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenIntake(bay)}
                          className="w-full text-bji-green-700 hover:bg-bji-green-50 border-bji-green-300 font-semibold justify-center"
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1 text-bji-green-600" />
                          Triage &amp; Assign Arriving Patient
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: CODE BLUE ACLS PROTOCOL ENGINE & TRACKER             */}
        {/* ============================================================ */}
        {activeTab === 'code_blue' && (
          <div className="space-y-4">
            <div className="bg-bji-slate-900 text-white rounded-bji p-4 border border-bji-red-600 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-bji-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-bji-red-500 animate-ping" />
                    <h2 className="text-base font-bold uppercase tracking-wider text-white">
                      ACLS Resuscitation Command Workstation
                    </h2>
                  </div>
                  <p className="text-xs text-bji-slate-400 mt-0.5">
                    Integrated American Heart Association (AHA) Adult Cardiac Arrest Algorithm with automated 2-minute CPR metronome.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCodeBlueModalOpen(true)}
                  className="bg-bji-red-600 hover:bg-bji-red-500 text-white border-bji-red-500 font-bold"
                >
                  <Zap className="w-4 h-4 mr-1.5" />
                  Launch Dedicated Pop-Up Console
                </Button>
              </div>

              {/* Summary of Last Recorded Resuscitation */}
              {resuscitations.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-bji-slate-950 p-3 rounded border border-bji-slate-800">
                      <div className="text-[10px] font-mono uppercase text-bji-slate-400">Status</div>
                      <div className="text-sm font-bold text-emerald-400">{resuscitations[0].status}</div>
                    </div>
                    <div className="bg-bji-slate-950 p-3 rounded border border-bji-slate-800">
                      <div className="text-[10px] font-mono uppercase text-bji-slate-400">Current / Final Cycle</div>
                      <div className="text-sm font-bold text-white">Cycle {resuscitations[0].currentCprCycle}</div>
                    </div>
                    <div className="bg-bji-slate-950 p-3 rounded border border-bji-slate-800">
                      <div className="text-[10px] font-mono uppercase text-bji-slate-400">Shocks Delivered</div>
                      <div className="text-sm font-bold text-bji-red-400">{resuscitations[0].shocksDelivered.length} Biphasic</div>
                    </div>
                    <div className="bg-bji-slate-950 p-3 rounded border border-bji-slate-800">
                      <div className="text-[10px] font-mono uppercase text-bji-slate-400">Medications Given</div>
                      <div className="text-sm font-bold text-amber-400">{resuscitations[0].medicationsGiven.length} Doses</div>
                    </div>
                  </div>

                  <div className="bg-bji-slate-950 p-3 rounded border border-bji-slate-800">
                    <div className="text-xs font-mono font-semibold text-bji-slate-300 uppercase mb-2">
                      Recent Resuscitation Telemetry Logs
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {resuscitations[0].eventLogs.slice(0, 8).map(log => (
                        <div key={log.id} className="text-xs flex items-center justify-between text-bji-slate-300 py-1 border-b border-bji-slate-900">
                          <span className="text-bji-slate-400 font-mono text-[11px]">
                            [{log.category}] Cycle {log.cycleNumber}: {log.text}
                          </span>
                          <span className="text-[10px] text-bji-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-bji-slate-500">
                  No resuscitation records found. Click &quot;Launch Dedicated Pop-Up Console&quot; to begin a live code or drill.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: MASS CASUALTY INCIDENT (START / SALT)                */}
        {/* ============================================================ */}
        {activeTab === 'mci_disaster' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* LEFT: START TRIAGE INTAKE FORM (5 cols) */}
            <div className="lg:col-span-5 bg-white p-4 rounded-bji border border-bji-slate-300 shadow-2xs space-y-3">
              <div className="border-b border-bji-slate-200 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-bji-slate-900">
                    START Disaster Triage Sorting Station
                  </h3>
                  <p className="text-[11px] text-bji-slate-500">
                    Simple Triage and Rapid Treatment algorithm for mass casualties.
                  </p>
                </div>
                <Badge tone="danger" size="xs">INCIDENT: HIGHWAY-77</Badge>
              </div>

              <form onSubmit={handleCreateMciTag} className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-bji-slate-600 block mb-0.5">Tag ID</label>
                    <input 
                      type="text" 
                      value={mciForm.tagNumber} 
                      onChange={(e) => setMciForm({ ...mciForm, tagNumber: e.target.value })}
                      className="w-full h-7 px-2 border border-bji-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-bji-slate-600 block mb-0.5">Age Group</label>
                    <select
                      value={mciForm.estimatedAgeGroup}
                      onChange={(e) => setMciForm({ ...mciForm, estimatedAgeGroup: e.target.value as any })}
                      className="w-full h-7 px-1.5 border border-bji-slate-300 rounded text-xs bg-white"
                    >
                      <option value="ADULT">Adult</option>
                      <option value="PEDIATRIC">Pediatric</option>
                      <option value="GERIATRIC">Geriatric</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-bji-slate-600 block mb-0.5">Chief Trauma Injuries</label>
                  <input
                    type="text"
                    value={mciForm.chiefInjuries}
                    onChange={(e) => setMciForm({ ...mciForm, chiefInjuries: e.target.value })}
                    placeholder="e.g. Compound fracture, crush syndrome, blast injury..."
                    className="w-full h-7 px-2 border border-bji-slate-300 rounded text-xs"
                    required
                  />
                </div>

                {/* START Criteria Checklist */}
                <div className="bg-bji-slate-50 p-2.5 rounded border border-bji-slate-200 space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-mono font-bold text-bji-slate-500 block">
                    START Algorithm Diagnostic Criteria
                  </span>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mciForm.isAmbulatory}
                      onChange={(e) => setMciForm({ ...mciForm, isAmbulatory: e.target.checked })}
                      className="rounded text-bji-green-600"
                    />
                    <span>Ambulatory (Can walk spontaneously? If YES -&gt; GREEN)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mciForm.spontaneousBreathing}
                      onChange={(e) => setMciForm({ ...mciForm, spontaneousBreathing: e.target.checked })}
                      className="rounded text-bji-red-600"
                    />
                    <span>Spontaneous Breathing Present? (If NO -&gt; BLACK)</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-bji-slate-500 block">Respiratory Rate (/min)</label>
                      <input
                        type="number"
                        value={mciForm.respiratoryRate}
                        onChange={(e) => setMciForm({ ...mciForm, respiratoryRate: Number(e.target.value) })}
                        className="w-full h-7 px-2 border border-bji-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-bji-slate-500 block">Perfusion (Radial Pulse)</label>
                      <select
                        value={mciForm.hasRadialPulse ? "YES" : "NO"}
                        onChange={(e) => setMciForm({ ...mciForm, hasRadialPulse: e.target.value === "YES" })}
                        className="w-full h-7 px-1.5 border border-bji-slate-300 rounded text-xs bg-white"
                      >
                        <option value="YES">Radial Pulse Present</option>
                        <option value="NO">Radial Pulse Absent</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={mciForm.followsCommands}
                      onChange={(e) => setMciForm({ ...mciForm, followsCommands: e.target.checked })}
                      className="rounded text-bji-blue-600"
                    />
                    <span>Follows Simple Commands? (Mental Status)</span>
                  </label>
                </div>

                {/* Auto Calculated Color Tag */}
                <div className="p-2.5 rounded border flex items-center justify-between text-xs font-bold">
                  <span>Computed Triage Tag:</span>
                  {(() => {
                    const tag = computedMciCategory();
                    return (
                      <span className={`px-2.5 py-1 rounded text-xs uppercase font-mono font-black ${
                        tag === 'RED_IMMEDIATE' ? "bg-bji-red-600 text-white" :
                        tag === 'YELLOW_DELAYED' ? "bg-amber-500 text-white" :
                        tag === 'GREEN_MINOR' ? "bg-emerald-600 text-white" : "bg-black text-white"
                      }`}>
                        {tag.replace('_', ' ')}
                      </span>
                    );
                  })()}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Commit Triage Tag &amp; Route Casualty
                </Button>
              </form>
            </div>

            {/* RIGHT: TAGGED CASUALTIES ROSTER & SURGE CAPACITY (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Surge Capacity Matrix */}
              <div className="bg-white p-3.5 rounded-bji border border-bji-slate-300 shadow-2xs space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase text-bji-slate-700">
                  Hospital Disaster Surge Meter
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-bji-slate-50 p-2 rounded border border-bji-slate-200">
                    <div className="text-[10px] text-bji-slate-500 font-mono">Trauma Bays</div>
                    <div className="font-bold text-bji-slate-900">{traumaBays.length - occupiedBaysCount} Available</div>
                  </div>
                  <div className="bg-bji-slate-50 p-2 rounded border border-bji-slate-200">
                    <div className="text-[10px] text-bji-slate-500 font-mono">ICU Ventilators</div>
                    <div className="font-bold text-bji-slate-900">8 / 12 Avail</div>
                  </div>
                  <div className="bg-bji-slate-50 p-2 rounded border border-bji-slate-200">
                    <div className="text-[10px] text-bji-slate-500 font-mono">O-Neg Blood</div>
                    <div className="font-bold text-bji-slate-900">14 Units</div>
                  </div>
                  <div className="bg-bji-slate-50 p-2 rounded border border-bji-slate-200">
                    <div className="text-[10px] text-bji-slate-500 font-mono">OR Suites</div>
                    <div className="font-bold text-bji-slate-900">2 / 4 Ready</div>
                  </div>
                </div>
              </div>

              {/* Tagged Roster List */}
              <div className="bg-white rounded-bji border border-bji-slate-300 shadow-2xs overflow-hidden">
                <div className="p-3 border-b border-bji-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase text-bji-slate-900">
                    Tagged Disaster Casualties ({mciTags.length})
                  </h4>
                  <span className="text-[10px] font-mono text-bji-slate-500">Live Field Log</span>
                </div>

                <div className="divide-y divide-bji-slate-200 max-h-96 overflow-y-auto">
                  {mciTags.map((tag) => (
                    <div key={tag.id} className="p-3 hover:bg-bji-slate-50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-mono font-black text-white ${
                          tag.triageCategory === 'RED_IMMEDIATE' ? "bg-bji-red-600" :
                          tag.triageCategory === 'YELLOW_DELAYED' ? "bg-amber-500" :
                          tag.triageCategory === 'GREEN_MINOR' ? "bg-emerald-600" : "bg-black"
                        }`}>
                          {tag.tagNumber}
                        </span>
                        <div>
                          <div className="font-bold text-bji-slate-900">{tag.chiefInjuries}</div>
                          <div className="text-[10px] text-bji-slate-500 font-mono">
                            {tag.estimatedAgeGroup} • {tag.gender} • Tagged by {tag.taggedBy}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge 
                          tone={
                            tag.triageCategory === 'RED_IMMEDIATE' ? "danger" :
                            tag.triageCategory === 'YELLOW_DELAYED' ? "warning" :
                            tag.triageCategory === 'GREEN_MINOR' ? "success" : "neutral"
                          } 
                          size="xs"
                        >
                          {tag.triageCategory.replace('_', ' ')}
                        </Badge>
                        <div className="text-[10px] font-mono text-bji-slate-400 mt-0.5">
                          {new Date(tag.taggedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* QUICK INTAKE MODAL */}
      {isIntakeModalOpen && selectedBayForIntake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-bji max-w-md w-full border border-bji-slate-300 shadow-xl p-4 space-y-3">
            <div className="border-b border-bji-slate-200 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-bji-slate-900">
                Arriving Trauma Intake — {selectedBayForIntake.bayNumber}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsIntakeModalOpen(false)}
                className="text-bji-slate-400 hover:text-bji-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIntake} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono uppercase text-bji-slate-600 block mb-0.5">Patient Full Name</label>
                <input
                  type="text"
                  value={intakeFormData.patientName}
                  onChange={(e) => setIntakeFormData({ ...intakeFormData, patientName: e.target.value })}
                  placeholder="e.g. John Doe / Trauma Unidentified"
                  className="w-full h-8 px-2 border border-bji-slate-300 rounded text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono uppercase text-bji-slate-600 block mb-0.5">MRN</label>
                  <input
                    type="text"
                    value={intakeFormData.mrn}
                    onChange={(e) => setIntakeFormData({ ...intakeFormData, mrn: e.target.value })}
                    className="w-full h-8 px-2 border border-bji-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-bji-slate-600 block mb-0.5">ESI Triage Acuity</label>
                  <select
                    value={intakeFormData.acuity}
                    onChange={(e) => setIntakeFormData({ ...intakeFormData, acuity: Number(e.target.value) as any })}
                    className="w-full h-8 px-2 border border-bji-slate-300 rounded text-xs bg-white font-semibold"
                  >
                    <option value={1}>ESI 1 - Resuscitation (Immediate Life Threat)</option>
                    <option value={2}>ESI 2 - Emergent (High Risk / Confusion / Severe Pain)</option>
                    <option value={3}>ESI 3 - Urgent (Multiple Resources Needed)</option>
                    <option value={4}>ESI 4 - Less Urgent (One Resource)</option>
                    <option value={5}>ESI 5 - Non-Urgent (No Resources)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-bji-slate-600 block mb-0.5">Chief Complaint / EMS Report</label>
                <textarea
                  value={intakeFormData.chiefComplaint}
                  onChange={(e) => setIntakeFormData({ ...intakeFormData, chiefComplaint: e.target.value })}
                  placeholder="Onset, mechanism of injury, field vitals, interventions given by EMS..."
                  className="w-full h-16 p-2 border border-bji-slate-300 rounded text-xs resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono uppercase text-bji-slate-600 block mb-0.5">Attending Physician</label>
                  <input
                    type="text"
                    value={intakeFormData.attendingPhysician}
                    onChange={(e) => setIntakeFormData({ ...intakeFormData, attendingPhysician: e.target.value })}
                    className="w-full h-8 px-2 border border-bji-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-bji-slate-600 block mb-0.5">Active Code Alert</label>
                  <select
                    value={intakeFormData.activeCode}
                    onChange={(e) => setIntakeFormData({ ...intakeFormData, activeCode: e.target.value as any })}
                    className="w-full h-8 px-2 border border-bji-slate-300 rounded text-xs bg-white"
                  >
                    <option value="">No Active Code</option>
                    <option value="CODE_BLUE">Code Blue (Cardiac Arrest)</option>
                    <option value="CODE_STEMI">Code STEMI (Acute MI)</option>
                    <option value="CODE_STROKE">Code Stroke (Rapid Neuro)</option>
                    <option value="TRAUMA_STAT">Trauma STAT (Level-1)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" size="xs" onClick={() => setIsIntakeModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="xs">
                  Confirm Bay Intake
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CODE BLUE ACLS MODAL */}
      <CodeBlueTrackerModal
        isOpen={isCodeBlueModalOpen}
        onClose={() => setIsCodeBlueModalOpen(false)}
        patientId={codeBlueTargetPatientId}
        initialDrillMode={isDrillModeActive}
      />
    </div>
  );
};
