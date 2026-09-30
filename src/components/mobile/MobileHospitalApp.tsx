"use client";

import React, { useState } from "react";
import { 
  BedDouble, 
  Activity, 
  Pill, 
  FileText, 
  Mic, 
  ShieldAlert, 
  Radio, 
  ArrowRight, 
  CheckCircle2, 
  Plus, 
  Clock, 
  Sparkles, 
  User, 
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Microscope,
  Stethoscope,
  Flame
} from "lucide-react";
import { useHospital } from "@/lib/state/hospital-store";
import { SBARService } from "@/lib/services/sbar-service";
import { aiOrchestrator } from "@/lib/ai/orchestrator";
import { SAMPLE_CONSULTATIONS } from "@/lib/data/sample-consultations";

export const MobileHospitalApp: React.FC = () => {
  const {
    patients,
    encounters,
    beds,
    observations,
    labs,
    orders,
    administrations,
    activePatientId,
    activeEncounterId,
    activePatient,
    activeEncounter,
    activeBed,
    setActivePatientId,
    recordVitals,
    administerMedication,
    triggerEmergencyCode,
    activeEmergency,
    currentStaff
  } = useHospital();

  // Mobile tabs: 'rounds' | 'patient' | 'vitals' | 'emar' | 'dictate' | 'sbar' | 'labs'
  const [activeTab, setActiveTab] = useState<'rounds' | 'patient' | 'vitals' | 'emar' | 'dictate' | 'sbar' | 'labs'>('patient');

  // Mobile Quick Vitals form
  const [sbp, setSbp] = useState(138);
  const [dbp, setDbp] = useState(82);
  const [hr, setHr] = useState(78);
  const [rr, setRr] = useState(18);
  const [spo2, setSpo2] = useState(97);
  const [temp, setTemp] = useState(37.1);
  const [glucose, setGlucose] = useState(188);

  // Mobile Dictate
  const [isRecording, setIsRecording] = useState(false);
  const [dictatedText, setDictatedText] = useState("");

  // Generated SBAR
  const [sbar, setSbar] = useState<any | null>(null);

  const patientObservations = observations.filter(o => o.patientId === activePatientId);
  const latestObservation = patientObservations[0];
  const patientLabs = labs.filter(l => l.patientId === activePatientId);
  const patientOrders = orders.filter(o => o.patientId === activePatientId);
  const patientAdms = administrations.filter(a => a.patientId === activePatientId);

  const allergies = activePatient.allergies || [];

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    recordVitals({
      patientId: activePatientId,
      encounterId: activeEncounterId,
      systolicBP: sbp,
      diastolicBP: dbp,
      heartRate: hr,
      respirationRate: rr,
      spO2: spo2,
      spO2Scale: 1,
      supplementalOxygen: false,
      temperatureCelsius: temp,
      consciousness: 'ALERT',
      bloodGlucoseMgDl: glucose
    });
    setActiveTab('patient');
  };

  const handleGenerateSbar = () => {
    const res = SBARService.generateSBAR(
      activePatient,
      activeEncounter,
      activeBed,
      latestObservation,
      patientLabs,
      patientOrders
    );
    setSbar(res);
    setActiveTab('sbar');
  };

  const handleToggleDictate = async () => {
    if (!isRecording) {
      setIsRecording(true);
      setDictatedText("Listening to ambient dialogue at bedside...");
      setTimeout(async () => {
        setIsRecording(false);
        try {
          const provider = aiOrchestrator.getProvider();
          const note = await provider.generateClinicalNote(activePatient as any, "Patient reports symptom improvement. Fasting glucose at 188 mg/dL. Recommending insulin titration.");
          setDictatedText(`S: ${note.subjective}\nO: ${note.objective}\nA: ${note.assessment}\nP: ${note.plan}`);
        } catch (err) {
          setDictatedText("Ambient note transcribed: Patient resting comfortably in bed. Vitals reviewed.");
        }
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans pb-20 select-none antialiased">
      
      {/* 🚨 SIMULATED EMERGENCY CODE STRIP */}
      {activeEmergency && (
        <div className="bg-[#EF4444] text-white p-2 text-center text-xs font-bold animate-pulse flex items-center justify-center gap-2">
          <Radio className="w-3.5 h-3.5 animate-spin" />
          <span>STAT {activeEmergency.codeType.replace('_', ' ')} AT {activeEmergency.location}</span>
        </div>
      )}

      {/* TOP MOBILE CLINICAL APP BAR */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2">
          {activeTab !== 'rounds' && (
            <button
              onClick={() => setActiveTab('rounds')}
              className="p-1 rounded bg-slate-100 text-slate-700 mr-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-xs text-slate-900 leading-tight">
                HospitalOS Rounding
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              {currentStaff.name} ({currentStaff.role})
            </p>
          </div>
        </div>

        {/* Rapid Emergency STAT Button */}
        <button
          onClick={() => triggerEmergencyCode('CODE_BLUE', `Bed ${activeBed?.bedNumber || '304-B'}`)}
          className="px-2.5 py-1 bg-red-600 active:bg-red-700 text-white text-[11px] font-bold rounded shadow-xs flex items-center gap-1"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>STAT Code</span>
        </button>
      </header>

      {/* MAIN MOBILE CONTENT */}
      <main className="flex-1 p-3.5 space-y-3.5">
        
        {/* ==================================================== */}
        {/* VIEW: ROUNDING QUEUE (ALL INPATIENTS)                */}
        {/* ==================================================== */}
        {activeTab === 'rounds' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Inpatient Rounding Roster ({patients.length})
              </span>
            </div>

            {patients.map((pat) => {
              const enc = encounters.find(e => e.patientId === pat.id && e.status === 'ACTIVE');
              const patBed = beds.find(b => b.id === enc?.activeBedId);
              const patObs = observations.filter(o => o.patientId === pat.id)[0];
              const isSelected = pat.id === activePatientId;

              return (
                <div
                  key={pat.id}
                  onClick={() => {
                    setActivePatientId(pat.id);
                    setActiveTab('patient');
                  }}
                  className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                    isSelected ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {pat.firstName[0]}{pat.lastName[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-slate-900">{pat.lastName}, {pat.firstName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{patBed ? `Bed ${patBed.bedNumber}` : 'Outpatient'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {enc?.admittingDiagnosis || "Inpatient Care"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {patObs && (
                      <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                        patObs.news2RiskTier === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        N:{patObs.news2Score}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW: ACTIVE PATIENT BEDSIDE HERO DASHBOARD          */}
        {/* ==================================================== */}
        {activeTab === 'patient' && (
          <div className="space-y-3">
            {/* Bedside Patient Card */}
            <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                    {activePatient.lastName}, {activePatient.firstName}
                  </h1>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {activeBed ? `Bed ${activeBed.bedNumber}` : 'Outpatient'} • MRN: {activePatient.mrn} • {activeEncounter.codeStatus}
                  </p>
                </div>

                {latestObservation && (
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                    latestObservation.news2RiskTier === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    NEWS2: {latestObservation.news2Score}
                  </span>
                )}
              </div>

              {/* Diagnosis Box */}
              <div className="p-2 rounded bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Diagnosis:</span> {activeEncounter.admittingDiagnosis}
              </div>

              {/* Red Allergy Alert */}
              {allergies.length > 0 && (
                <div className="p-2 rounded bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>Allergy: {allergies.map(a => `${a.allergen} (${a.reaction})`).join(", ")}</span>
                </div>
              )}

              {/* Vitals Compact Strip */}
              {latestObservation && (
                <div className="grid grid-cols-4 gap-1.5 pt-1 text-center text-xs font-mono">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-400 block font-sans">BP</span>
                    <span className="font-bold text-slate-900">{latestObservation.systolicBP}/{latestObservation.diastolicBP}</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-400 block font-sans">HR</span>
                    <span className="font-bold text-slate-900">{latestObservation.heartRate}</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-400 block font-sans">SpO2</span>
                    <span className="font-bold text-slate-900">{latestObservation.spO2}%</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-400 block font-sans">Glucose</span>
                    <span className="font-bold text-slate-900">{latestObservation.bloodGlucoseMgDl || '--'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ONE-HANDED BEDSIDE ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveTab('vitals')}
                className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-bold text-xs flex flex-col items-center justify-center gap-1 active:scale-98 transition"
              >
                <Activity className="w-5 h-5 text-teal-600" />
                <span>[ LOG VITALS ]</span>
              </button>

              <button
                onClick={() => setActiveTab('emar')}
                className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs flex flex-col items-center justify-center gap-1 active:scale-98 transition"
              >
                <Pill className="w-5 h-5 text-blue-600" />
                <span>[ eMAR DOSES ]</span>
              </button>

              <button
                onClick={() => setActiveTab('dictate')}
                className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex flex-col items-center justify-center gap-1 active:scale-98 transition"
              >
                <Mic className="w-5 h-5 text-emerald-600" />
                <span>[ VOICE NOTE ]</span>
              </button>

              <button
                onClick={handleGenerateSbar}
                className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-bold text-xs flex flex-col items-center justify-center gap-1 active:scale-98 transition"
              >
                <FileText className="w-5 h-5 text-purple-600" />
                <span>[ SBAR HANDOVER ]</span>
              </button>
            </div>

            {/* Diagnostic Labs Fast Preview */}
            <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Microscope className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recent Diagnostic Labs</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{patientLabs.length} results</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {patientLabs.slice(0, 3).map(lab => (
                  <div key={lab.id} className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{lab.testName}</span>
                      <p className="text-[10px] text-slate-400 font-mono">Ref: {lab.referenceRange}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold ${lab.flag !== 'NORMAL' ? 'text-red-600' : 'text-slate-800'}`}>
                        {lab.value} {lab.unit}
                      </span>
                      {lab.flag !== 'NORMAL' && (
                        <span className="block text-[9px] font-bold text-red-600 uppercase font-mono">{lab.flag}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW: QUICK BEDSIDE VITALS LOGGER                    */}
        {/* ==================================================== */}
        {activeTab === 'vitals' && (
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Bedside Vitals Capture</h2>

            <form onSubmit={handleSaveVitals} className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-600 font-semibold block mb-0.5">Systolic BP</label>
                  <input
                    type="number"
                    value={sbp}
                    onChange={(e) => setSbp(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-0.5">Diastolic BP</label>
                  <input
                    type="number"
                    value={dbp}
                    onChange={(e) => setDbp(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-600 font-semibold block mb-0.5">Heart Rate</label>
                  <input
                    type="number"
                    value={hr}
                    onChange={(e) => setHr(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-0.5">Respiration Rate</label>
                  <input
                    type="number"
                    value={rr}
                    onChange={(e) => setRr(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-600 font-semibold block mb-0.5">SpO2 (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-0.5">Glucose (mg/dL)</label>
                  <input
                    type="number"
                    value={glucose}
                    onChange={(e) => setGlucose(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 active:bg-teal-700 text-white font-bold rounded shadow-xs transition text-xs"
              >
                Save &amp; Recalculate NEWS2
              </button>
            </form>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW: BEDSIDE eMAR MEDICATION ADMINISTRATION         */}
        {/* ==================================================== */}
        {activeTab === 'emar' && (
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Bedside eMAR Admin</h2>

            <div className="space-y-2 text-xs">
              {patientAdms.map((adm) => {
                const ord = orders.find(o => o.id === adm.orderId);
                return (
                  <div key={adm.id} className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ord?.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(adm.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500 font-mono">Status: {adm.status}</span>
                      {adm.status !== 'GIVEN' ? (
                        <button
                          onClick={() => administerMedication({ administrationId: adm.id, status: 'GIVEN' })}
                          className="px-2.5 py-1 bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded text-xs"
                        >
                          Confirm Given
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold font-mono">✓ Given</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW: AMBIENT VOICE DICTATION                        */}
        {/* ==================================================== */}
        {activeTab === 'dictate' && (
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs space-y-3.5 text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Ambient Bedside Voice Scribe</h2>

            <button
              onClick={handleToggleDictate}
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white transition active:scale-95 shadow-md ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-600'
              }`}
            >
              <Mic className="w-7 h-7" />
            </button>

            <p className="text-[11px] text-slate-500">
              {isRecording ? "Listening to doctor & patient dialogue..." : "Tap to record bedside encounter"}
            </p>

            {dictatedText && (
              <div className="p-3 bg-slate-50 rounded border text-xs text-left whitespace-pre-line text-slate-800">
                {dictatedText}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW: SBAR STRUCTURED HANDOVER                       */}
        {/* ==================================================== */}
        {activeTab === 'sbar' && sbar && (
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs space-y-2.5 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-900">SBAR Bedside Handover</h2>

            <div className="p-2 bg-purple-50 rounded border border-purple-100">
              <strong className="block text-purple-900 mb-0.5">S — Situation</strong>
              <p className="text-slate-700">{sbar.situation}</p>
            </div>
            <div className="p-2 bg-purple-50 rounded border border-purple-100">
              <strong className="block text-purple-900 mb-0.5">B — Background</strong>
              <p className="text-slate-700">{sbar.background}</p>
            </div>
            <div className="p-2 bg-purple-50 rounded border border-purple-100">
              <strong className="block text-purple-900 mb-0.5">A — Assessment</strong>
              <p className="text-slate-700">{sbar.assessment}</p>
            </div>
            <div className="p-2 bg-purple-50 rounded border border-purple-100">
              <strong className="block text-purple-900 mb-0.5">R — Recommendation</strong>
              <p className="text-slate-700">{sbar.recommendation}</p>
            </div>
          </div>
        )}
      </main>

      {/* FIXED BOTTOM TOUCH NAVIGATION DOCK */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('rounds')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            activeTab === 'rounds' ? 'text-blue-600' : 'text-slate-400'
          }`}
        >
          <BedDouble className="w-4 h-4 mb-0.5" />
          <span>Rounds</span>
        </button>

        <button
          onClick={() => setActiveTab('patient')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            activeTab === 'patient' ? 'text-blue-600' : 'text-slate-400'
          }`}
        >
          <User className="w-4 h-4 mb-0.5" />
          <span>Patient</span>
        </button>

        <button
          onClick={() => setActiveTab('vitals')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            activeTab === 'vitals' ? 'text-teal-600' : 'text-slate-400'
          }`}
        >
          <Activity className="w-4 h-4 mb-0.5" />
          <span>Vitals</span>
        </button>

        <button
          onClick={() => setActiveTab('emar')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            activeTab === 'emar' ? 'text-blue-600' : 'text-slate-400'
          }`}
        >
          <Pill className="w-4 h-4 mb-0.5" />
          <span>eMAR</span>
        </button>

        <button
          onClick={() => setActiveTab('dictate')}
          className={`flex flex-col items-center text-[10px] font-bold ${
            activeTab === 'dictate' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <Mic className="w-4 h-4 mb-0.5" />
          <span>Dictate</span>
        </button>
      </nav>
    </div>
  );
};
