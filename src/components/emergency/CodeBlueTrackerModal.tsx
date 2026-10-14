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
  FileText
} from "lucide-react";
import { 
  ResuscitationRecord, 
  ResuscitationRhythm, 
  ReversibleCausesState,
  ResuscitationShock,
  ResuscitationMedication,
  ResuscitationLogEntry
} from "@/types/hospital";
import { useHospital } from "@/lib/state/hospital-store";
import { useSession } from "@/lib/auth/session-context";
import { Button, Badge } from "@/components/ui";

interface CodeBlueTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  initialDrillMode?: boolean;
}

export const CodeBlueTrackerModal: React.FC<CodeBlueTrackerModalProps> = ({
  isOpen,
  onClose,
  patientId,
  initialDrillMode = false
}) => {
  const { 
    activeFacilityId,
    patients, 
    activePatient, 
    resuscitations, 
    recordResuscitationEvent,
    staff
  } = useHospital();
  const { currentUser } = useSession();

  // Target patient
  const targetPatient = patientId 
    ? patients.find(p => p.id === patientId) || activePatient 
    : activePatient;

  // Active or existing resuscitation record
  const existingResus = resuscitations.find(
    r => r.patientId === targetPatient.id && r.status === 'ACTIVE'
  ) || resuscitations[0];

  const [isDrill, setIsDrill] = useState(initialDrillMode || existingResus?.isDrill || false);
  const [currentCycle, setCurrentCycle] = useState(existingResus?.currentCprCycle || 1);
  const [cycleSecondsRemaining, setCycleSecondsRemaining] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(existingResus?.totalElapsedSeconds || 0);

  // Epinephrine interval countdown (180s = 3 minutes)
  const [epiSecondsRemaining, setEpiSecondsRemaining] = useState(180);

  // Active Rhythm
  const [currentRhythm, setCurrentRhythm] = useState<ResuscitationRhythm>(
    existingResus?.lastRhythm || 'VENTRICULAR_FIBRILLATION'
  );

  // Energy selection for shock
  const [selectedEnergy, setSelectedEnergy] = useState<number>(200);

  // Logs and history
  const [eventLogs, setEventLogs] = useState<ResuscitationLogEntry[]>(
    existingResus?.eventLogs || []
  );
  const [shocksDelivered, setShocksDelivered] = useState<ResuscitationShock[]>(
    existingResus?.shocksDelivered || []
  );
  const [medicationsGiven, setMedicationsGiven] = useState<ResuscitationMedication[]>(
    existingResus?.medicationsGiven || []
  );

  // Airway telemetry
  const [airwayType, setAirwayType] = useState<'BAG_VALVE_MASK' | 'SUPRAGLOTTIC' | 'ENDOTRACHEAL_TUBE'>(
    existingResus?.airway?.type || 'ENDOTRACHEAL_TUBE'
  );
  const [tubeSize, setTubeSize] = useState(existingResus?.airway?.tubeSize || '7.5 mm');
  const [tubeDepth, setTubeDepth] = useState(existingResus?.airway?.depthCm || 22);
  const [etco2, setEtco2] = useState(existingResus?.airway?.etco2MmHg || 26);

  // Reversible Causes (5 H's and 5 T's)
  const [causes, setCauses] = useState<ReversibleCausesState>(
    existingResus?.reversibleCauses || {
      hypovolemia: false,
      hypoxia: true,
      hydrogenAcidosis: false,
      hypoHyperkalemia: false,
      hypothermia: false,
      tensionPneumothorax: false,
      tamponadeCardiac: false,
      toxins: false,
      thrombosisPulmonary: false,
      thrombosisCoronary: true
    }
  );
  const [causesNotes, setCausesNotes] = useState(existingResus?.reversibleCausesNotes || "");

  // Team Lead
  const [teamLead, setTeamLead] = useState(existingResus?.teamLead || currentUser?.name || "Dr. Gregory House, MD");

  // Timer tick
  useEffect(() => {
    if (!isOpen || !isTimerRunning) return;

    const interval = setInterval(() => {
      setTotalSeconds(prev => prev + 1);
      setCycleSecondsRemaining(prev => {
        if (prev <= 1) {
          // Cycle finished! 2 minutes elapsed
          return 120;
        }
        return prev - 1;
      });
      setEpiSecondsRemaining(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isTimerRunning]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isShockable = (rhythm: ResuscitationRhythm) => {
    return rhythm === 'VENTRICULAR_FIBRILLATION' || rhythm === 'PULSELESS_VT';
  };

  // Add event log
  const logAction = (category: ResuscitationLogEntry['category'], text: string) => {
    const newEntry: ResuscitationLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      category,
      text,
      cycleNumber: currentCycle
    };
    setEventLogs(prev => [newEntry, ...prev]);
  };

  // Deliver Shock
  const handleDeliverShock = () => {
    const shock: ResuscitationShock = {
      id: `shk-${Date.now()}`,
      timestamp: new Date().toISOString(),
      cycleNumber: currentCycle,
      energyJoules: selectedEnergy,
      deliveredBy: currentUser?.name || "Attending Physician"
    };
    setShocksDelivered(prev => [...prev, shock]);
    logAction('SHOCK', `Delivered ${selectedEnergy}J biphasic shock (#${shocksDelivered.length + 1}). Immediately resumed chest compressions.`);
  };

  // Give Medication
  const handleGiveMed = (drug: string, dose: string, route: string = "IV Push") => {
    const med: ResuscitationMedication = {
      id: `med-${Date.now()}`,
      timestamp: new Date().toISOString(),
      cycleNumber: currentCycle,
      drug,
      dose,
      route,
      givenBy: currentUser?.name || "Code Nurse"
    };
    setMedicationsGiven(prev => [...prev, med]);
    if (drug.toLowerCase().includes('epinephrine')) {
      setEpiSecondsRemaining(180); // Reset 3-minute Epi timer
    }
    logAction('MEDICATION', `Administered ${drug} ${dose} via ${route}. Flushed with 20mL NS.`);
  };

  // Rhythm Check
  const handleSelectRhythm = (rhythm: ResuscitationRhythm) => {
    setCurrentRhythm(rhythm);
    const shockable = isShockable(rhythm);
    logAction('RHYTHM', `Rhythm assessed: ${rhythm.replace('_', ' ')} (${shockable ? 'SHOCKABLE' : 'NON-SHOCKABLE'}).`);
  };

  // Complete Cycle
  const handleNextCycle = () => {
    const next = currentCycle + 1;
    setCurrentCycle(next);
    setCycleSecondsRemaining(120);
    logAction('NOTE', `Advanced to CPR Cycle ${next}. Compressions rotated. Compressor swapped.`);
  };

  // Attest ROSC
  const handleAttestRosc = () => {
    setCurrentRhythm('ROSC');
    setIsTimerRunning(false);
    logAction('NOTE', `🎉 Return of Spontaneous Circulation (ROSC) achieved and verified! Pulse palpable, EtCO2 spiked to 42 mmHg.`);

    const record: ResuscitationRecord = {
      id: existingResus?.id || `resus-${Date.now()}`,
      facilityId: activeFacilityId,
      patientId: targetPatient.id,
      encounterId: targetPatient.id ? `Encounter/enc-${targetPatient.id}` : 'Encounter/enc-emergency',
      codeType: 'CODE_BLUE',
      isDrill,
      status: 'ROSC_ACHIEVED',
      startedAt: existingResus?.startedAt || new Date(Date.now() - totalSeconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      currentCprCycle: currentCycle,
      currentCycleSeconds: 120 - cycleSecondsRemaining,
      totalElapsedSeconds: totalSeconds,
      lastRhythm: 'ROSC',
      rhythmHistory: existingResus?.rhythmHistory || [],
      shocksDelivered,
      medicationsGiven,
      airway: {
        type: airwayType,
        tubeSize,
        depthCm: tubeDepth,
        etco2MmHg: etco2,
        verifiedMethod: "Waveform capnography + bilateral breath sounds"
      },
      reversibleCauses: causes,
      reversibleCausesNotes: causesNotes,
      teamLead,
      compressorStaff: [currentUser?.name || "Staff Nurse"],
      airwayStaff: "Respiratory Therapist",
      recorderStaff: "Amanda Vaughn, RN",
      eventLogs,
      outcomeNotes: "Patient achieved sustained ROSC. Post-cardiac arrest care bundle activated. Transferring to Cardiac ICU."
    };

    recordResuscitationEvent(record);
    onClose();
  };

  // Cease Resuscitation
  const handleCeaseEfforts = () => {
    setIsTimerRunning(false);
    logAction('NOTE', `Resuscitation efforts terminated by Team Lead ${teamLead} after ${currentCycle} cycles. Asystole confirmed across leads.`);

    const record: ResuscitationRecord = {
      id: existingResus?.id || `resus-${Date.now()}`,
      facilityId: activeFacilityId,
      patientId: targetPatient.id,
      encounterId: targetPatient.id ? `Encounter/enc-${targetPatient.id}` : 'Encounter/enc-emergency',
      codeType: 'CODE_BLUE',
      isDrill,
      status: 'TERMINATED',
      startedAt: existingResus?.startedAt || new Date(Date.now() - totalSeconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      currentCprCycle: currentCycle,
      currentCycleSeconds: 120 - cycleSecondsRemaining,
      totalElapsedSeconds: totalSeconds,
      lastRhythm: currentRhythm,
      rhythmHistory: existingResus?.rhythmHistory || [],
      shocksDelivered,
      medicationsGiven,
      airway: {
        type: airwayType,
        tubeSize,
        depthCm: tubeDepth,
        etco2MmHg: etco2
      },
      reversibleCauses: causes,
      reversibleCausesNotes: causesNotes,
      teamLead,
      compressorStaff: [currentUser?.name || "Staff Nurse"],
      airwayStaff: "Respiratory Therapist",
      recorderStaff: "Amanda Vaughn, RN",
      eventLogs,
      outcomeNotes: `Cessation of resuscitation efforts pronounced at ${new Date().toLocaleTimeString()}. Total CPR time: ${Math.floor(totalSeconds / 60)} minutes.`
    };

    recordResuscitationEvent(record);
    onClose();
  };

  const toggleCause = (key: keyof ReversibleCausesState) => {
    setCauses(prev => {
      const nextVal = !prev[key];
      logAction('REVERSIBLE_CAUSE', `Updated 5H/5T check: ${key} -> ${nextVal ? 'SUSPECTED / POSITIVE' : 'RULED OUT'}`);
      return { ...prev, [key]: nextVal };
    });
  };

  const shockableNow = isShockable(currentRhythm);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-bji-slate-900 text-white rounded-bji border-2 border-bji-red-600 shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden">
        {/* TOP STATUS ALERT BANNER */}
        <div className={`px-4 py-2.5 flex items-center justify-between text-xs font-bold tracking-wider select-none ${
          isDrill ? "bg-amber-600 text-white" : "bg-bji-red-600 text-white"
        }`}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
            <span className="uppercase text-sm">
              {isDrill ? "SIMULATION DRILL RUN: CODE BLUE ACLS" : "LIVE RESUSCITATION: CODE BLUE ACTIVATION"}
            </span>
            <span className="opacity-90 font-mono font-normal">
              • {targetPatient.lastName}, {targetPatient.firstName} ({targetPatient.mrn})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDrill(!isDrill)}
              className="px-2 py-0.5 rounded text-[10px] font-mono border border-white/40 hover:bg-white/20 transition-colors"
            >
              Mode: {isDrill ? "DRILL SIMULATION" : "LIVE CLINICAL"} (Toggle)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* MAIN RESUSCITATION DASHBOARD */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-bji-slate-800">
          
          {/* LEFT COLUMN: TIMERS & RHYTHM CONTROLS (5 cols) */}
          <div className="lg:col-span-5 p-4 space-y-4 bg-bji-slate-900/90 flex flex-col">
            
            {/* CPR Cycle Clock + Visual Metronome */}
            <div className="bg-bji-slate-950 p-4 rounded-bji border border-bji-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-mono tracking-widest text-bji-slate-400">
                  CPR Cycle {currentCycle} (2-Min Protocol)
                </span>
                <span className="text-xs font-mono text-bji-slate-400">
                  Total Elapsed: <strong className="text-white">{formatTimer(totalSeconds)}</strong>
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    cycleSecondsRemaining < 15 ? "bg-bji-red-500 animate-ping" : "bg-bji-green-500 animate-pulse"
                  }`} />
                  <span className={`font-mono text-4xl sm:text-5xl font-black tracking-tight ${
                    cycleSecondsRemaining < 20 ? "text-bji-red-400" : "text-white"
                  }`}>
                    {formatTimer(cycleSecondsRemaining)}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleNextCycle}
                  className="bg-bji-slate-800 hover:bg-bji-slate-700 text-white border-bji-slate-700"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Cycle +1 / Swap Compressor
                </Button>
              </div>

              {/* CPR Progress Bar */}
              <div className="w-full bg-bji-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    cycleSecondsRemaining < 20 ? "bg-bji-red-500" : "bg-bji-green-500"
                  }`}
                  style={{ width: `${((120 - cycleSecondsRemaining) / 120) * 100}%` }}
                />
              </div>
            </div>

            {/* Epinephrine Dosing Clock */}
            <div className="bg-bji-slate-950/80 p-3 rounded-bji border border-bji-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-bji-slate-400 uppercase">
                  Epi 1mg Re-Dose Countdown (3-5m)
                </div>
                <div className={`font-mono text-xl font-bold ${
                  epiSecondsRemaining === 0 ? "text-bji-red-400 animate-pulse font-black" : "text-amber-400"
                }`}>
                  {epiSecondsRemaining === 0 ? "EPINEPHRINE DUE NOW!" : formatTimer(epiSecondsRemaining)}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGiveMed("Epinephrine", "1 mg", "IV Push")}
                className="bg-amber-600 hover:bg-amber-700 text-white border-amber-500 font-bold"
              >
                + Push Epi 1mg IV
              </Button>
            </div>

            {/* RHYTHM SELECTION ENGINE */}
            <div className="bg-bji-slate-950 p-3 rounded-bji border border-bji-slate-800 space-y-2">
              <div className="text-xs uppercase font-mono tracking-wider text-bji-slate-400 flex items-center justify-between">
                <span>Rhythm Check Assessment</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  shockableNow ? "bg-bji-red-600 text-white" : "bg-bji-slate-800 text-bji-slate-300"
                }`}>
                  {shockableNow ? "SHOCKABLE RHYTHM" : "NON-SHOCKABLE"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectRhythm('VENTRICULAR_FIBRILLATION')}
                  className={`p-2 rounded border text-left transition-all ${
                    currentRhythm === 'VENTRICULAR_FIBRILLATION'
                      ? "bg-bji-red-700 border-bji-red-400 text-white font-bold ring-1 ring-bji-red-400"
                      : "bg-bji-slate-900 border-bji-slate-800 text-bji-slate-300 hover:bg-bji-slate-800"
                  }`}
                >
                  <div className="font-semibold">V-Fib (VF)</div>
                  <div className="text-[10px] opacity-80">Shockable</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRhythm('PULSELESS_VT')}
                  className={`p-2 rounded border text-left transition-all ${
                    currentRhythm === 'PULSELESS_VT'
                      ? "bg-bji-red-700 border-bji-red-400 text-white font-bold ring-1 ring-bji-red-400"
                      : "bg-bji-slate-900 border-bji-slate-800 text-bji-slate-300 hover:bg-bji-slate-800"
                  }`}
                >
                  <div className="font-semibold">Pulseless VT (pVT)</div>
                  <div className="text-[10px] opacity-80">Shockable</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRhythm('PEA')}
                  className={`p-2 rounded border text-left transition-all ${
                    currentRhythm === 'PEA'
                      ? "bg-bji-blue-700 border-bji-blue-400 text-white font-bold ring-1 ring-bji-blue-400"
                      : "bg-bji-slate-900 border-bji-slate-800 text-bji-slate-300 hover:bg-bji-slate-800"
                  }`}
                >
                  <div className="font-semibold">PEA</div>
                  <div className="text-[10px] opacity-80">Non-Shockable • CPR + Epi</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRhythm('ASYSTOLE')}
                  className={`p-2 rounded border text-left transition-all ${
                    currentRhythm === 'ASYSTOLE'
                      ? "bg-bji-slate-700 border-bji-slate-400 text-white font-bold ring-1 ring-bji-slate-400"
                      : "bg-bji-slate-900 border-bji-slate-800 text-bji-slate-300 hover:bg-bji-slate-800"
                  }`}
                >
                  <div className="font-semibold">Asystole</div>
                  <div className="text-[10px] opacity-80">Non-Shockable • CPR + Epi</div>
                </button>
              </div>
            </div>

            {/* DEFIBRILLATOR DELIVERY BAR */}
            <div className={`p-3 rounded-bji border ${
              shockableNow 
                ? "bg-bji-red-950/70 border-bji-red-600 ring-1 ring-bji-red-500" 
                : "bg-bji-slate-950 border-bji-slate-800 opacity-80"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-bji-red-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-bji-red-400" />
                  Biphasic Defibrillation ({shocksDelivered.length} Given)
                </span>
                <div className="flex items-center gap-1">
                  {[120, 150, 200].map(joules => (
                    <button
                      key={joules}
                      type="button"
                      onClick={() => setSelectedEnergy(joules)}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-semibold transition-colors ${
                        selectedEnergy === joules
                          ? "bg-bji-red-600 text-white"
                          : "bg-bji-slate-800 text-bji-slate-400 hover:text-white"
                      }`}
                    >
                      {joules}J
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDeliverShock}
                className="w-full py-2.5 bg-bji-red-600 hover:bg-bji-red-500 text-white font-bold text-sm rounded-bji uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
              >
                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-bounce" />
                Deliver {selectedEnergy}J Shock Now (Clear Patient!)
              </button>
            </div>

            {/* QUICK MEDICATION PUSH BUTTONS */}
            <div className="bg-bji-slate-950 p-3 rounded-bji border border-bji-slate-800 space-y-2">
              <span className="text-xs uppercase font-mono tracking-wider text-bji-slate-400">
                Stat ACLS Pharmacotherapy
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleGiveMed("Amiodarone", "300 mg", "IV Bolus")}
                  className="px-2 py-1.5 bg-bji-slate-800 hover:bg-bji-slate-700 border border-bji-slate-700 rounded text-xs text-left text-white"
                >
                  <div className="font-semibold text-bji-blue-400">Amiodarone 300mg</div>
                  <div className="text-[10px] text-bji-slate-400">1st Dose (Refractory VF/pVT)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleGiveMed("Amiodarone", "150 mg", "IV Bolus")}
                  className="px-2 py-1.5 bg-bji-slate-800 hover:bg-bji-slate-700 border border-bji-slate-700 rounded text-xs text-left text-white"
                >
                  <div className="font-semibold text-bji-blue-400">Amiodarone 150mg</div>
                  <div className="text-[10px] text-bji-slate-400">2nd Dose (Refractory VF/pVT)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleGiveMed("Calcium Chloride", "1 g", "IV Push")}
                  className="px-2 py-1.5 bg-bji-slate-800 hover:bg-bji-slate-700 border border-bji-slate-700 rounded text-xs text-left text-white"
                >
                  <div className="font-semibold text-amber-400">Calcium Chloride 1g</div>
                  <div className="text-[10px] text-bji-slate-400">Hyperkalemia / CCB Toxicity</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleGiveMed("Sodium Bicarbonate", "50 mEq", "IV Push")}
                  className="px-2 py-1.5 bg-bji-slate-800 hover:bg-bji-slate-700 border border-bji-slate-700 rounded text-xs text-left text-white"
                >
                  <div className="font-semibold text-emerald-400">Sodium Bicarb 50mEq</div>
                  <div className="text-[10px] text-bji-slate-400">Severe Acidosis / TCA Toxicity</div>
                </button>
              </div>
            </div>

          </div>

          {/* MIDDLE COLUMN: 5 H's & 5 T's REVERSIBLE CAUSES (4 cols) */}
          <div className="lg:col-span-4 p-4 space-y-3 bg-bji-slate-900 flex flex-col">
            <div className="flex items-center justify-between border-b border-bji-slate-800 pb-2">
              <span className="text-xs uppercase font-mono tracking-wider text-bji-slate-300 font-bold">
                Reversible Causes (5 H&apos;s &amp; 5 T&apos;s)
              </span>
              <span className="text-[10px] text-bji-slate-400">Rule-Out Checklist</span>
            </div>

            {/* 5 H's */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-bji-blue-400 font-bold">The 5 H&apos;s</span>
              <div className="grid grid-cols-1 gap-1 text-xs">
                {[
                  { key: "hypovolemia", label: "Hypovolemia (Fluids / Blood bolus)" },
                  { key: "hypoxia", label: "Hypoxia (100% FiO2 / Tube check)" },
                  { key: "hydrogenAcidosis", label: "Hydrogen ion / Acidosis (Ventilation/Bicarb)" },
                  { key: "hypoHyperkalemia", label: "Hypo/Hyperkalemia (Calcium/Insulin+D50)" },
                  { key: "hypothermia", label: "Hypothermia (Active rewarming)" },
                ].map(({ key, label }) => {
                  const isChecked = causes[key as keyof ReversibleCausesState];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleCause(key as keyof ReversibleCausesState)}
                      className={`flex items-center justify-between p-2 rounded border text-left transition-colors ${
                        isChecked 
                          ? "bg-amber-900/60 border-amber-600 text-amber-200" 
                          : "bg-bji-slate-950 border-bji-slate-800 text-bji-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-[11px] font-medium truncate">{label}</span>
                      {isChecked ? (
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-xs border border-bji-slate-700" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5 T's */}
            <div className="space-y-1 pt-2">
              <span className="text-[10px] uppercase font-mono text-bji-red-400 font-bold">The 5 T&apos;s</span>
              <div className="grid grid-cols-1 gap-1 text-xs">
                {[
                  { key: "tensionPneumothorax", label: "Tension Pneumothorax (Needle Decompression)" },
                  { key: "tamponadeCardiac", label: "Tamponade Cardiac (Pericardiocentesis)" },
                  { key: "toxins", label: "Toxins / Overdose (Specific Antidote)" },
                  { key: "thrombosisPulmonary", label: "Thrombosis Pulmonary (Massive PE / tPA)" },
                  { key: "thrombosisCoronary", label: "Thrombosis Coronary (STEMI / Cath Lab)" },
                ].map(({ key, label }) => {
                  const isChecked = causes[key as keyof ReversibleCausesState];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleCause(key as keyof ReversibleCausesState)}
                      className={`flex items-center justify-between p-2 rounded border text-left transition-colors ${
                        isChecked 
                          ? "bg-bji-red-900/60 border-bji-red-600 text-bji-red-200" 
                          : "bg-bji-slate-950 border-bji-slate-800 text-bji-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-[11px] font-medium truncate">{label}</span>
                      {isChecked ? (
                        <Check className="w-3.5 h-3.5 text-bji-red-400 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-xs border border-bji-slate-700" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Airway telemetry status */}
            <div className="bg-bji-slate-950 p-2.5 rounded-bji border border-bji-slate-800 space-y-1.5 mt-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-bji-slate-300 font-semibold">
                <span>Advanced Airway Telemetry</span>
                <span className="text-bji-green-400">EtCO2: {etco2} mmHg</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-bji-slate-400">
                <div className="bg-bji-slate-900 p-1.5 rounded text-center">
                  <div className="text-white font-bold">{airwayType.replace('_', ' ')}</div>
                  <div>Device</div>
                </div>
                <div className="bg-bji-slate-900 p-1.5 rounded text-center">
                  <div className="text-white font-bold">{tubeSize}</div>
                  <div>Size</div>
                </div>
                <div className="bg-bji-slate-900 p-1.5 rounded text-center">
                  <div className="text-white font-bold">{tubeDepth} cm</div>
                  <div>Depth @ Teeth</div>
                </div>
              </div>
            </div>

            {/* Assessment Notes */}
            <div className="space-y-1 pt-1">
              <label className="text-[10px] font-mono uppercase text-bji-slate-400 block">
                Etiology &amp; Ultrasound Findings
              </label>
              <textarea
                value={causesNotes}
                onChange={(e) => setCausesNotes(e.target.value)}
                placeholder="Bedside echo/POCUS findings, arterial blood gas results, potassium values..."
                className="w-full h-16 p-2 text-xs bg-bji-slate-950 border border-bji-slate-800 rounded text-bji-slate-200 resize-none outline-none focus:border-bji-blue-500"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: REAL-TIME AUDIT LOG & RESOLUTION ATTESTATION (3 cols) */}
          <div className="lg:col-span-3 p-4 flex flex-col justify-between bg-bji-slate-950 space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-bji-slate-800 pb-2 mb-2">
                <span className="text-xs uppercase font-mono tracking-wider text-bji-slate-300 font-bold">
                  Resuscitation Event Log
                </span>
                <span className="text-[10px] text-bji-slate-500 font-mono">
                  {eventLogs.length} Events
                </span>
              </div>

              {/* Chronological Event Scroller */}
              <div className="h-72 overflow-y-auto space-y-1.5 pr-1">
                {eventLogs.length === 0 ? (
                  <div className="text-xs text-bji-slate-500 text-center py-8">
                    No actions logged yet. Deliver shocks, push meds, or log rhythm checks.
                  </div>
                ) : (
                  eventLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-1.5 rounded bg-bji-slate-900/80 border border-bji-slate-800 text-[11px] leading-tight space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-bji-slate-400">
                        <span className={`font-bold ${
                          log.category === 'SHOCK' ? "text-bji-red-400" :
                          log.category === 'MEDICATION' ? "text-amber-400" :
                          log.category === 'RHYTHM' ? "text-bji-blue-400" : "text-bji-slate-400"
                        }`}>
                          [{log.category}] Cycle {log.cycleNumber}
                        </span>
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <div className="text-bji-slate-200">{log.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RESOLUTION CONTROLS */}
            <div className="pt-3 border-t border-bji-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-mono text-bji-slate-400 text-center">
                Clinical Outcome Attestation
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAttestRosc}
                className="w-full bg-bji-green-700 hover:bg-bji-green-600 text-white border-bji-green-500 font-bold justify-center"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Attest ROSC Achieved (Pulse Present)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCeaseEfforts}
                className="w-full bg-bji-slate-800 hover:bg-bji-red-950 text-bji-red-400 border-bji-slate-700 hover:border-bji-red-700 font-bold justify-center"
              >
                <AlertOctagon className="w-4 h-4 mr-1.5" />
                Cease Resuscitation Efforts (Pronounce)
              </Button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
