"use client";

import React, { useState, useMemo } from "react";
import { 
  Activity, 
  Wind, 
  Heart, 
  Thermometer, 
  Droplets, 
  Brain, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Info 
} from "lucide-react";
import { useHospital } from "@/lib/state/hospital-store";
import { ConsciousnessLevel, Patient, Encounter } from "@/types/hospital";
import { calculateNEWS2, getRiskTierBadgeClasses } from "@/lib/services/news2";
import { Dialog, Button, Badge } from "@/components/ui";

interface VitalsEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
  encounter?: Encounter;
}

export const VitalsEntryModal: React.FC<VitalsEntryModalProps> = ({
  isOpen,
  onClose,
  patient: propPatient,
  encounter: propEncounter
}) => {
  const { 
    activePatient, 
    activeEncounter, 
    recordVitals, 
    currentStaff 
  } = useHospital();

  const patient = propPatient || activePatient;
  const encounter = propEncounter || activeEncounter;

  // Form State
  const [systolicBP, setSystolicBP] = useState<number>(120);
  const [diastolicBP, setDiastolicBP] = useState<number>(80);
  const [heartRate, setHeartRate] = useState<number>(75);
  const [respirationRate, setRespirationRate] = useState<number>(16);
  const [spO2, setSpO2] = useState<number>(98);
  const [spO2Scale, setSpO2Scale] = useState<1 | 2>(1);
  const [supplementalOxygen, setSupplementalOxygen] = useState<boolean>(false);
  const [oxygenFlowLMin, setOxygenFlowLMin] = useState<number>(2);
  const [temperatureCelsius, setTemperatureCelsius] = useState<number>(37.0);
  const [consciousness, setConsciousness] = useState<ConsciousnessLevel>('ALERT');
  const [bloodGlucoseMgDl, setBloodGlucoseMgDl] = useState<number | undefined>(110);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Real-time dynamic computed NEWS2 score
  const computedNews2 = useMemo(() => {
    return calculateNEWS2({
      respirationRate,
      spO2,
      spO2Scale,
      supplementalOxygen,
      oxygenFlowLMin: supplementalOxygen ? oxygenFlowLMin : undefined,
      temperatureCelsius,
      systolicBP,
      diastolicBP,
      heartRate,
      consciousness,
      bloodGlucoseMgDl
    });
  }, [
    respirationRate,
    spO2,
    spO2Scale,
    supplementalOxygen,
    oxygenFlowLMin,
    temperatureCelsius,
    systolicBP,
    diastolicBP,
    heartRate,
    consciousness,
    bloodGlucoseMgDl
  ]);

  const riskBadge = getRiskTierBadgeClasses(computedNews2.riskTier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    setIsSubmitting(true);
    try {
      recordVitals({
        patientId: patient.id,
        encounterId: encounter?.id || `Encounter/enc-${Date.now()}`,
        respirationRate,
        spO2,
        spO2Scale,
        supplementalOxygen,
        oxygenFlowLMin: supplementalOxygen ? oxygenFlowLMin : undefined,
        temperatureCelsius,
        systolicBP,
        diastolicBP,
        heartRate,
        consciousness,
        bloodGlucoseMgDl
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Record Inpatient Observations & NEWS2"
      subtitle={patient ? `${patient.firstName} ${patient.lastName} (MRN: ${patient.mrn}) • Logged by ${currentStaff.name}` : "Patient Vitals Documentation"}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {/* ========================================================= */}
        {/* LIVE REAL-TIME NEWS2 CALCULATION WIDGET                   */}
        {/* ========================================================= */}
        <div className={`p-3.5 rounded-bji border transition-all ${
          computedNews2.riskTier === 'HIGH'
            ? 'bg-red-50 border-red-300 text-red-900'
            : computedNews2.riskTier === 'MEDIUM' || computedNews2.hasSingleParameterRedAlert
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-bji flex items-center justify-center font-mono font-black text-xl shrink-0 ${
                computedNews2.riskTier === 'HIGH'
                  ? 'bg-red-600 text-white'
                  : computedNews2.riskTier === 'MEDIUM' || computedNews2.hasSingleParameterRedAlert
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {computedNews2.totalScore}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-tight">
                    Computed NEWS2 Score: {computedNews2.totalScore} Points
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shadow-2xs ${riskBadge.bg} ${riskBadge.text}`}>
                    {computedNews2.riskTier.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5 opacity-90 font-medium">
                  {computedNews2.clinicalResponse}
                </p>
              </div>
            </div>

            {/* Single Parameter Red Alert Flag */}
            {computedNews2.hasSingleParameterRedAlert && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 border border-red-300 rounded text-red-800 font-bold text-[10px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Single Score 3 Triggered</span>
              </div>
            )}
          </div>

          {/* Subscores breakdown pill strip */}
          <div className="mt-3 pt-2.5 border-t border-black/10 flex flex-wrap gap-1.5">
            {computedNews2.breakdown.map((b, idx) => (
              <span 
                key={idx}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 ${
                  b.score === 3 ? 'bg-red-600 text-white font-bold' :
                  b.score === 2 ? 'bg-orange-500 text-white font-bold' :
                  b.score === 1 ? 'bg-amber-300 text-slate-900 font-bold' :
                  'bg-white/80 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{b.parameter.split(' ')[0]}:</span>
                <span>+{b.score}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* INPUT FIELDS: RESPIRATORY & OXYGENATION                   */}
        {/* ========================================================= */}
        <div className="bg-slate-50 border border-slate-200 rounded-bji p-3.5 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Wind className="w-4 h-4 text-blue-600" />
              <span>Respiratory &amp; Oxygenation Parameters</span>
            </span>
            {/* SpO2 Scale Switcher */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-500 font-semibold">SpO2 Target Scale:</span>
              <div className="flex bg-white border border-slate-300 rounded p-0.5">
                <button
                  type="button"
                  onClick={() => setSpO2Scale(1)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                    spO2Scale === 1 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Scale 1 (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setSpO2Scale(2)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                    spO2Scale === 2 ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Prescribed for hypercapnic respiratory failure / COPD target 88-92%"
                >
                  Scale 2 (COPD / Hypercapnic)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Respiration Rate */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Respiration Rate (breaths/min)
              </label>
              <input
                type="number"
                min="4"
                max="60"
                value={respirationRate}
                onChange={(e) => setRespirationRate(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-bji font-mono font-bold text-sm text-slate-900 focus:outline-hidden focus:border-bji-clinical-blue"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono">Normal: 12 - 20</span>
            </div>

            {/* SpO2 Saturation */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Oxygen Saturation (SpO2 %)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={spO2}
                onChange={(e) => setSpO2(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-bji font-mono font-bold text-sm text-slate-900 focus:outline-hidden focus:border-bji-clinical-blue"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono">
                {spO2Scale === 1 ? 'Target: ≥ 96%' : 'Target: 88 - 92% (Scale 2)'}
              </span>
            </div>

            {/* Supplemental Oxygen Toggle */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Supplemental Oxygen Therapy
              </label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setSupplementalOxygen(false)}
                  className={`flex-1 py-1.5 px-2 rounded-bji text-xs font-semibold border ${
                    !supplementalOxygen 
                      ? 'bg-blue-50 border-blue-300 text-blue-800' 
                      : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  Room Air (0 pts)
                </button>
                <button
                  type="button"
                  onClick={() => setSupplementalOxygen(true)}
                  className={`flex-1 py-1.5 px-2 rounded-bji text-xs font-semibold border ${
                    supplementalOxygen 
                      ? 'bg-cyan-600 border-cyan-700 text-white font-bold' 
                      : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  Prescribed O2 (+2 pts)
                </button>
              </div>
              {supplementalOxygen && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-slate-600">Flow Rate:</span>
                  <input
                    type="number"
                    min="0.5"
                    max="15"
                    step="0.5"
                    value={oxygenFlowLMin}
                    onChange={(e) => setOxygenFlowLMin(Number(e.target.value))}
                    className="w-16 p-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-center"
                  />
                  <span className="text-[11px] text-slate-500 font-mono">L/min</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* INPUT FIELDS: CARDIOVASCULAR & HEMODYNAMICS              */}
        {/* ========================================================= */}
        <div className="bg-slate-50 border border-slate-200 rounded-bji p-3.5 space-y-3">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-200">
            <Heart className="w-4 h-4 text-rose-600" />
            <span className="font-bold text-slate-900 text-xs">
              Cardiovascular &amp; Hemodynamics
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Systolic BP */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Systolic BP (mmHg)
              </label>
              <input
                type="number"
                min="50"
                max="260"
                value={systolicBP}
                onChange={(e) => setSystolicBP(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-bji font-mono font-bold text-sm text-slate-900 focus:outline-hidden focus:border-bji-clinical-blue"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono">Normal: 111 - 219</span>
            </div>

            {/* Diastolic BP */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Diastolic BP (mmHg)
              </label>
              <input
                type="number"
                min="30"
                max="160"
                value={diastolicBP}
                onChange={(e) => setDiastolicBP(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-bji font-mono font-bold text-sm text-slate-900 focus:outline-hidden focus:border-bji-clinical-blue"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono">Normal: 60 - 89</span>
            </div>

            {/* Heart Rate / Pulse */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Heart Rate / Pulse (bpm)
              </label>
              <input
                type="number"
                min="20"
                max="220"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-bji font-mono font-bold text-sm text-slate-900 focus:outline-hidden focus:border-bji-clinical-blue"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono">Normal: 51 - 90</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* INPUT FIELDS: NEUROLOGY, METABOLISM & TEMPERATURE        */}
        {/* ========================================================= */}
        <div className="bg-slate-50 border border-slate-200 rounded-bji p-3.5 space-y-3">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-200">
            <Brain className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-900 text-xs">
              Consciousness, Temperature &amp; Glycemia
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Consciousness / ACVPU */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Consciousness Level (ACVPU)
              </label>
              <select
                value={consciousness}
                onChange={(e) => setConsciousness(e.target.value as ConsciousnessLevel)}
                className="w-full p-2 bg-white border border-slate-300 rounded-bji text-xs font-bold text-slate-900 focus:outline-hidden focus:border-bji-clinical-blue"
              >
                <option value="ALERT">Alert (0 pts)</option>
                <option value="CVPU_VOICE">Voice Responding (+3 pts)</option>
                <option value="CVPU_PAIN">Pain Responding (+3 pts)</option>
                <option value="CVPU_UNRESPONSIVE">Unresponsive (+3 pts)</option>
              </select>
              <span className="text-[10px] text-slate-500 font-mono">New confusion adds 3 pts</span>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Body Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                min="30.0"
                max="44.0"
                value={temperatureCelsius}
                onChange={(e) => setTemperatureCelsius(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-bji font-mono font-bold text-sm text-slate-900 focus:outline-hidden focus:border-bji-clinical-blue"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono">Normal: 36.1 - 38.0 °C</span>
            </div>

            {/* Capillary Blood Glucose */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Capillary Blood Glucose (mg/dL)
              </label>
              <input
                type="number"
                min="20"
                max="800"
                value={bloodGlucoseMgDl || ''}
                onChange={(e) => setBloodGlucoseMgDl(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional bedside check"
                className="w-full p-2 bg-white border border-slate-300 rounded-bji font-mono text-sm text-slate-900 focus:outline-hidden focus:border-bji-clinical-blue"
              />
              <span className="text-[10px] text-slate-500 font-mono">Fasting: 70 - 140 mg/dL</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Signed by: <strong className="text-slate-800">{currentStaff.name} ({currentStaff.role})</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-bji-health-green hover:bg-emerald-700 font-bold shadow-xs"
            >
              Save Observation &amp; NEWS2
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
