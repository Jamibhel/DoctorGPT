"use client";

import React, { useState, useMemo } from "react";
import { 
  Activity, 
  Plus, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Wind, 
  Heart, 
  Thermometer, 
  Droplets, 
  Brain, 
  Stethoscope, 
  Filter 
} from "lucide-react";
import { useHospital } from "@/lib/state/hospital-store";
import { VitalSignObservation, Patient } from "@/types/hospital";
import { 
  calculateNEWS2, 
  getScoreColorClasses, 
  getRiskTierBadgeClasses, 
  getNEWS2Subscores 
} from "@/lib/services/news2";
import { Badge, Button, Dialog } from "@/components/ui";

interface VitalsFlowsheetProps {
  onOpenRecordModal?: () => void;
  patient?: Patient;
}

export const VitalsFlowsheet: React.FC<VitalsFlowsheetProps> = ({
  onOpenRecordModal,
  patient: propPatient
}) => {
  const { 
    activePatient, 
    observations, 
    activeFacility 
  } = useHospital();

  const patient = propPatient || activePatient;

  // View Controls
  const [timeFilter, setTimeFilter] = useState<'24H' | '48H' | 'ALL'>('ALL');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [showSubscores, setShowSubscores] = useState<boolean>(true);
  const [selectedObsDetail, setSelectedObsDetail] = useState<VitalSignObservation | null>(null);

  // Filter observations for this patient
  const patientObservations = useMemo(() => {
    if (!patient) return [];
    
    // Support matching both primary patient ID and possible alias
    const patientIds = [patient.id];
    if (patient.id === "Patient/pat-sjm-1001") patientIds.push("Patient/pat-1001");
    if (patient.id === "Patient/pat-sjm-1002") patientIds.push("Patient/pat-1002");
    if (patient.id === "Patient/pat-1001") patientIds.push("Patient/pat-sjm-1001");
    if (patient.id === "Patient/pat-1002") patientIds.push("Patient/pat-sjm-1002");

    let list = observations.filter(o => patientIds.includes(o.patientId));

    // Time filtering
    if (timeFilter !== 'ALL') {
      const now = new Date("2026-09-30T23:59:59Z").getTime(); // anchored to clinical seed horizon
      const hours = timeFilter === '24H' ? 24 : 48;
      const cutoff = now - hours * 60 * 60 * 1000;
      list = list.filter(o => new Date(o.timestamp).getTime() >= cutoff);
    }

    // Sort
    return [...list].sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return sortOrder === 'DESC' ? tB - tA : tA - tB;
    });
  }, [observations, patient, timeFilter, sortOrder]);

  // Latest observation & trend
  const latestObs = patientObservations[0];
  const previousObs = patientObservations[1];

  const trend = useMemo(() => {
    if (!latestObs || !previousObs) return 'STABLE';
    if (latestObs.news2Score < previousObs.news2Score) return 'IMPROVING';
    if (latestObs.news2Score > previousObs.news2Score) return 'DETERIORATING';
    return 'STABLE';
  }, [latestObs, previousObs]);

  // Compute subscores for an observation
  const getObsSubscores = (obs: VitalSignObservation) => {
    return getNEWS2Subscores(obs);
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* ========================================================= */}
      {/* 1. CLINICAL HEADER & TELEMETRY SUMMARY BANNER            */}
      {/* ========================================================= */}
      <div className="bg-white border border-[#D7DEE7] rounded-bji shadow-xs p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#E7ECF3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-bji bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-bji-clinical-blue" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Clinical Observations &amp; Flowsheet
                </h2>
                <Badge variant="outline" className="text-[10px] font-mono border-slate-300">
                  RCP NEWS2 Compliant
                </Badge>
                {patient && (
                  <span className="text-xs text-slate-500 font-mono">
                    MRN: <strong className="text-slate-800">{patient.mrn}</strong> ({patient.firstName} {patient.lastName})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Serial physiological parameters, organ failure warning scores, and rapid escalation protocol matrix.
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2">
            {onOpenRecordModal && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenRecordModal}
                className="gap-1.5 font-bold shadow-xs bg-bji-health-green hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4" />
                <span>Record Observation</span>
              </Button>
            )}
          </div>
        </div>

        {/* Current Physiological Status Banner */}
        {latestObs ? (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
            {/* NEWS2 Score Card */}
            <div className={`p-3 rounded-bji border flex items-center justify-between ${
              latestObs.news2RiskTier === 'HIGH'
                ? 'bg-red-50 border-red-200 text-red-900'
                : latestObs.news2RiskTier === 'MEDIUM' || latestObs.news2RiskTier === 'LOW_MEDIUM'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                  Latest NEWS2 Score
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black font-mono">{latestObs.news2Score}</span>
                  <span className="text-[11px] font-bold">/ 20 Points</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  latestObs.news2RiskTier === 'HIGH'
                    ? 'bg-red-600 text-white'
                    : latestObs.news2RiskTier === 'MEDIUM'
                    ? 'bg-amber-500 text-white'
                    : latestObs.news2RiskTier === 'LOW_MEDIUM'
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {latestObs.news2RiskTier.replace('_', ' ')}
                </span>
                <span className="text-[10px] block mt-1 opacity-75 font-mono">
                  {new Date(latestObs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Physiological Trend */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-bji flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Serial Trend
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-bold text-xs">
                  {trend === 'IMPROVING' && (
                    <>
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">De-escalating / Improving</span>
                    </>
                  )}
                  {trend === 'DETERIORATING' && (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-600" />
                      <span className="text-red-700">Deteriorating (+{latestObs.news2Score - (previousObs?.news2Score || 0)})</span>
                    </>
                  )}
                  {trend === 'STABLE' && (
                    <>
                      <Minus className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">Physiologically Stable</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right font-mono text-[10px] text-slate-500">
                {patientObservations.length} logs on file
              </div>
            </div>

            {/* SpO2 & Oxygen Prescription Mode */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-bji flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Oxygenation &amp; Scale
                </span>
                <div className="font-bold text-xs text-slate-800 mt-1">
                  SpO2: <span className="font-mono text-sm">{latestObs.spO2}%</span>
                  {latestObs.supplementalOxygen ? (
                    <span className="text-blue-600 ml-1 font-mono text-[11px]">(O2 {latestObs.oxygenFlowLMin || 2}L)</span>
                  ) : (
                    <span className="text-slate-500 ml-1 font-mono text-[11px]">(Room Air)</span>
                  )}
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                latestObs.spO2Scale === 2 
                  ? 'bg-purple-50 text-purple-700 border-purple-200' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                Scale {latestObs.spO2Scale}
              </span>
            </div>

            {/* Clinical Action Recommendation */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-bji">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                RCP Protocol Guidance
              </span>
              <p className="text-[11px] font-medium text-slate-700 mt-1 line-clamp-2 leading-snug">
                {calculateNEWS2(latestObs).clinicalResponse}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-bji text-center text-xs text-slate-500">
            No vital signs recorded for this patient yet. Click <strong>Record Observation</strong> to enter the initial baseline set.
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. SPREADSHEET FLOWSHEET CONTROLS & TABLE MATRIX          */}
      {/* ========================================================= */}
      <div className="bg-white border border-[#D7DEE7] rounded-bji shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3 bg-[#F8FAFC] border-b border-[#E7ECF3] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">
              Observation Window:
            </span>
            <div className="flex items-center bg-white border border-slate-200 rounded p-0.5 shadow-2xs">
              {(['ALL', '24H', '48H'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                    timeFilter === f 
                      ? 'bg-bji-clinical-blue text-white font-bold' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f === 'ALL' ? 'All History' : `Past ${f}`}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
              className="ml-2 px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[11px] font-mono text-slate-600 flex items-center gap-1 shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{sortOrder === 'DESC' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSubscores(prev => !prev)}
              className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[11px] text-slate-600 flex items-center gap-1 shadow-2xs"
            >
              {showSubscores ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showSubscores ? 'Hide NEWS2 Subscores' : 'Show NEWS2 Subscores'}</span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono">
              {patientObservations.length} columns displayed
            </span>
          </div>
        </div>

        {/* Table Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-2.5 px-3 sticky left-0 bg-slate-100 z-10 w-64 min-w-[240px] border-r border-slate-200 shadow-xs">
                  Physiological Parameter
                </th>
                <th className="py-2.5 px-3 w-32 min-w-[120px] text-slate-500 font-mono text-[11px] border-r border-slate-200">
                  Target Range
                </th>
                {patientObservations.map((obs) => {
                  const d = new Date(obs.timestamp);
                  return (
                    <th 
                      key={obs.id} 
                      onClick={() => setSelectedObsDetail(obs)}
                      className="py-2.5 px-3 min-w-[130px] border-r border-slate-200 font-mono hover:bg-slate-200/80 cursor-pointer transition text-center group"
                    >
                      <div className="text-[11px] font-bold text-slate-800">
                        {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[9px] text-slate-400 font-normal">
                        {d.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate max-w-[120px]">
                        {obs.recordedBy.replace('Practitioner/', '')}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {/* 1. Respiration Rate */}
              <tr className="hover:bg-slate-50/70 transition">
                <td className="py-2 px-3 sticky left-0 bg-white font-semibold flex items-center gap-2 border-r border-slate-200 shadow-xs">
                  <Wind className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Respiration Rate</span>
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-200">
                  12 - 20 bpm
                </td>
                {patientObservations.map(obs => {
                  const sub = getObsSubscores(obs);
                  const rrScore = sub.parameterMap["Respiration Rate"]?.score || 0;
                  const colors = getScoreColorClasses(rrScore);
                  return (
                    <td key={obs.id} className={`py-2 px-3 text-center font-mono font-bold border-r border-slate-200 ${colors.bg} ${colors.text}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{obs.respirationRate}</span>
                        {rrScore > 0 && (
                          <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-white/80 shadow-2xs">
                            +{rrScore}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* 2. SpO2 */}
              <tr className="hover:bg-slate-50/70 transition">
                <td className="py-2 px-3 sticky left-0 bg-white font-semibold flex items-center gap-2 border-r border-slate-200 shadow-xs">
                  <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Oxygen Saturation (SpO2)</span>
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-200">
                  ≥ 96% (S1) / 88-92% (S2)
                </td>
                {patientObservations.map(obs => {
                  const sub = getObsSubscores(obs);
                  const paramKey = obs.spO2Scale === 2 ? "SpO2 (Scale 2 - Hypercapnic)" : "SpO2 (Scale 1 - Standard)";
                  const spo2Score = sub.parameterMap[paramKey]?.score || 0;
                  const colors = getScoreColorClasses(spo2Score);
                  return (
                    <td key={obs.id} className={`py-2 px-3 text-center font-mono font-bold border-r border-slate-200 ${colors.bg} ${colors.text}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{obs.spO2}%</span>
                        {spo2Score > 0 && (
                          <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-white/80 shadow-2xs">
                            +{spo2Score}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* 3. Supplemental Oxygen */}
              <tr className="hover:bg-slate-50/70 transition">
                <td className="py-2 px-3 sticky left-0 bg-white font-semibold flex items-center gap-2 border-r border-slate-200 shadow-xs">
                  <Wind className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>Supplemental O2 Therapy</span>
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-200">
                  Room Air (0 pts)
                </td>
                {patientObservations.map(obs => {
                  const o2Score = obs.supplementalOxygen ? 2 : 0;
                  const colors = getScoreColorClasses(o2Score);
                  return (
                    <td key={obs.id} className={`py-2 px-3 text-center font-mono text-[11px] border-r border-slate-200 ${colors.bg} ${colors.text}`}>
                      {obs.supplementalOxygen ? (
                        <span className="font-bold">
                          O2 ({obs.oxygenFlowLMin || 2} L/min)
                        </span>
                      ) : (
                        <span className="text-slate-400">Room Air</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* 4. Systolic Blood Pressure */}
              <tr className="hover:bg-slate-50/70 transition">
                <td className="py-2 px-3 sticky left-0 bg-white font-semibold flex items-center gap-2 border-r border-slate-200 shadow-xs">
                  <Activity className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Systolic Blood Pressure</span>
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-200">
                  111 - 219 mmHg
                </td>
                {patientObservations.map(obs => {
                  const sub = getObsSubscores(obs);
                  const sbpScore = sub.parameterMap["Systolic Blood Pressure"]?.score || 0;
                  const colors = getScoreColorClasses(sbpScore);
                  return (
                    <td key={obs.id} className={`py-2 px-3 text-center font-mono font-bold border-r border-slate-200 ${colors.bg} ${colors.text}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{obs.systolicBP}</span>
                        {sbpScore > 0 && (
                          <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-white/80 shadow-2xs">
                            +{sbpScore}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* 5. Diastolic Blood Pressure */}
              <tr className="hover:bg-slate-50/70 transition">
                <td className="py-2 px-3 sticky left-0 bg-white font-semibold flex items-center gap-2 border-r border-slate-200 shadow-xs">
                  <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Diastolic Blood Pressure</span>
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-200">
                  60 - 89 mmHg
                </td>
                {patientObservations.map(obs => (
                  <td key={obs.id} className="py-2 px-3 text-center font-mono text-[11px] text-slate-700 border-r border-slate-200">
                    {obs.diastolicBP}
                  </td>
                ))}
              </tr>

              {/* 6. Heart Rate (Pulse) */}
              <tr className="hover:bg-slate-50/70 transition">
                <td className="py-2 px-3 sticky left-0 bg-white font-semibold flex items-center gap-2 border-r border-slate-200 shadow-xs">
                  <Heart className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Heart Rate (Pulse)</span>
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-200">
                  51 - 90 bpm
                </td>
                {patientObservations.map(obs => {
                  const sub = getObsSubscores(obs);
                  const hrScore = sub.parameterMap["Heart Rate"]?.score || 0;
                  const colors = getScoreColorClasses(hrScore);
                  return (
                    <td key={obs.id} className={`py-2 px-3 text-center font-mono font-bold border-r border-slate-200 ${colors.bg} ${colors.text}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{obs.heartRate}</span>
                        {hrScore > 0 && (
                          <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-white/80 shadow-2xs">
                            +{hrScore}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* 7. Consciousness (ACVPU) */}
              <tr className="hover:bg-slate-50/70 transition">
                <td className="py-2 px-3 sticky left-0 bg-white font-semibold flex items-center gap-2 border-r border-slate-200 shadow-xs">
                  <Brain className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Consciousness (ACVPU)</span>
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-200">
                  Alert (0 pts)
                </td>
                {patientObservations.map(obs => {
                  const isAlert = obs.consciousness === 'ALERT';
                  const cScore = isAlert ? 0 : 3;
                  const colors = getScoreColorClasses(cScore);
                  return (
                    <td key={obs.id} className={`py-2 px-3 text-center font-mono text-[11px] border-r border-slate-200 ${colors.bg} ${colors.text}`}>
                      <span className={isAlert ? 'text-slate-700' : 'text-red-700 font-bold'}>
                        {obs.consciousness}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* 8. Temperature */}
              <tr className="hover:bg-slate-50/70 transition">
                <td className="py-2 px-3 sticky left-0 bg-white font-semibold flex items-center gap-2 border-r border-slate-200 shadow-xs">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Temperature</span>
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-200">
                  36.1 - 38.0 °C
                </td>
                {patientObservations.map(obs => {
                  const sub = getObsSubscores(obs);
                  const tempScore = sub.parameterMap["Temperature"]?.score || 0;
                  const colors = getScoreColorClasses(tempScore);
                  return (
                    <td key={obs.id} className={`py-2 px-3 text-center font-mono font-bold border-r border-slate-200 ${colors.bg} ${colors.text}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{obs.temperatureCelsius.toFixed(1)}°C</span>
                        {tempScore > 0 && (
                          <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-white/80 shadow-2xs">
                            +{tempScore}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* 9. Blood Glucose */}
              <tr className="hover:bg-slate-50/70 transition">
                <td className="py-2 px-3 sticky left-0 bg-white font-semibold flex items-center gap-2 border-r border-slate-200 shadow-xs">
                  <Droplets className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Capillary Blood Glucose</span>
                </td>
                <td className="py-2 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-200">
                  70 - 140 mg/dL
                </td>
                {patientObservations.map(obs => (
                  <td key={obs.id} className="py-2 px-3 text-center font-mono text-[11px] text-slate-700 border-r border-slate-200">
                    {obs.bloodGlucoseMgDl ? `${obs.bloodGlucoseMgDl} mg/dL` : '--'}
                  </td>
                ))}
              </tr>

              {/* ========================================================= */}
              {/* EXPANDABLE: ORGAN FAILURE SUBSCORES BREAKDOWN             */}
              {/* ========================================================= */}
              {showSubscores && (
                <>
                  <tr className="bg-slate-100/90 font-bold text-[10px] uppercase tracking-wider text-slate-600 border-t border-b border-slate-200">
                    <td colSpan={2} className="py-1 px-3 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">
                      NEWS2 Organ System Subscore Breakdown
                    </td>
                    {patientObservations.map(obs => (
                      <td key={obs.id} className="py-1 px-3 text-center font-mono text-[9px] border-r border-slate-200 text-slate-400">
                        Subscores
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 text-[11px]">
                    <td className="py-1.5 px-3 sticky left-0 bg-slate-50 font-medium pl-6 text-slate-600 border-r border-slate-200">
                      • Respiration Subscore
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[10px] text-slate-400 border-r border-slate-200">0 - 3</td>
                    {patientObservations.map(obs => {
                      const score = getObsSubscores(obs).parameterMap["Respiration Rate"]?.score || 0;
                      return (
                        <td key={obs.id} className="py-1.5 px-3 text-center font-mono border-r border-slate-200 text-slate-700">
                          {score}
                        </td>
                      );
                    })}
                  </tr>

                  <tr className="bg-slate-50/40 text-[11px]">
                    <td className="py-1.5 px-3 sticky left-0 bg-slate-50 font-medium pl-6 text-slate-600 border-r border-slate-200">
                      • Oxygenation Subscore
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[10px] text-slate-400 border-r border-slate-200">0 - 3</td>
                    {patientObservations.map(obs => {
                      const sub = getObsSubscores(obs);
                      const key = obs.spO2Scale === 2 ? "SpO2 (Scale 2 - Hypercapnic)" : "SpO2 (Scale 1 - Standard)";
                      const score = sub.parameterMap[key]?.score || 0;
                      return (
                        <td key={obs.id} className="py-1.5 px-3 text-center font-mono border-r border-slate-200 text-slate-700">
                          {score}
                        </td>
                      );
                    })}
                  </tr>

                  <tr className="bg-slate-50/40 text-[11px]">
                    <td className="py-1.5 px-3 sticky left-0 bg-slate-50 font-medium pl-6 text-slate-600 border-r border-slate-200">
                      • Supplemental O2 Points
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[10px] text-slate-400 border-r border-slate-200">0 or 2</td>
                    {patientObservations.map(obs => (
                      <td key={obs.id} className="py-1.5 px-3 text-center font-mono border-r border-slate-200 text-slate-700">
                        {obs.supplementalOxygen ? 2 : 0}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 text-[11px]">
                    <td className="py-1.5 px-3 sticky left-0 bg-slate-50 font-medium pl-6 text-slate-600 border-r border-slate-200">
                      • Systolic BP Subscore
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[10px] text-slate-400 border-r border-slate-200">0 - 3</td>
                    {patientObservations.map(obs => {
                      const score = getObsSubscores(obs).parameterMap["Systolic Blood Pressure"]?.score || 0;
                      return (
                        <td key={obs.id} className="py-1.5 px-3 text-center font-mono border-r border-slate-200 text-slate-700">
                          {score}
                        </td>
                      );
                    })}
                  </tr>

                  <tr className="bg-slate-50/40 text-[11px]">
                    <td className="py-1.5 px-3 sticky left-0 bg-slate-50 font-medium pl-6 text-slate-600 border-r border-slate-200">
                      • Pulse Subscore
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[10px] text-slate-400 border-r border-slate-200">0 - 3</td>
                    {patientObservations.map(obs => {
                      const score = getObsSubscores(obs).parameterMap["Heart Rate"]?.score || 0;
                      return (
                        <td key={obs.id} className="py-1.5 px-3 text-center font-mono border-r border-slate-200 text-slate-700">
                          {score}
                        </td>
                      );
                    })}
                  </tr>

                  <tr className="bg-slate-50/40 text-[11px]">
                    <td className="py-1.5 px-3 sticky left-0 bg-slate-50 font-medium pl-6 text-slate-600 border-r border-slate-200">
                      • Consciousness Subscore
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[10px] text-slate-400 border-r border-slate-200">0 or 3</td>
                    {patientObservations.map(obs => (
                      <td key={obs.id} className="py-1.5 px-3 text-center font-mono border-r border-slate-200 text-slate-700">
                        {obs.consciousness === 'ALERT' ? 0 : 3}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-slate-50/40 text-[11px]">
                    <td className="py-1.5 px-3 sticky left-0 bg-slate-50 font-medium pl-6 text-slate-600 border-r border-slate-200">
                      • Temperature Subscore
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[10px] text-slate-400 border-r border-slate-200">0 - 2</td>
                    {patientObservations.map(obs => {
                      const score = getObsSubscores(obs).parameterMap["Temperature"]?.score || 0;
                      return (
                        <td key={obs.id} className="py-1.5 px-3 text-center font-mono border-r border-slate-200 text-slate-700">
                          {score}
                        </td>
                      );
                    })}
                  </tr>
                </>
              )}

              {/* ========================================================= */}
              {/* TOTAL NEWS2 AGGREGATE SCORE (PRIMARY CLINICAL OUTCOME)    */}
              {/* ========================================================= */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td className="py-3 px-3 sticky left-0 bg-slate-100 z-10 text-slate-900 font-bold flex items-center justify-between border-r border-slate-200 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-bji-clinical-blue" />
                    <span>RCP NEWS2 Total Score</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-normal">Sum of 7 vitals</span>
                </td>
                <td className="py-3 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-200">
                  0 - 4 Routine
                </td>
                {patientObservations.map(obs => {
                  const badge = getRiskTierBadgeClasses(obs.news2RiskTier);
                  return (
                    <td 
                      key={obs.id} 
                      onClick={() => setSelectedObsDetail(obs)}
                      className="py-3 px-3 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-200/50 transition"
                    >
                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-mono font-bold shadow-xs ${badge.bg} ${badge.text}`}>
                        Score {obs.news2Score}
                      </span>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1 font-mono">
                        {obs.news2RiskTier.replace('_', ' ')}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. DETAILED OBSERVATION INSPECTION MODAL                 */}
      {/* ========================================================= */}
      {selectedObsDetail && (
        <Dialog
          isOpen={!!selectedObsDetail}
          onClose={() => setSelectedObsDetail(null)}
          title={`Observation Set: ${new Date(selectedObsDetail.timestamp).toLocaleString()}`}
          subtitle={`NEWS2 Score: ${selectedObsDetail.news2Score} (${selectedObsDetail.news2RiskTier}) • Recorded by ${selectedObsDetail.recordedBy}`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs font-sans">
            {/* Clinical response banner */}
            <div className={`p-3 rounded-bji border ${
              selectedObsDetail.news2RiskTier === 'HIGH'
                ? 'bg-red-50 border-red-200 text-red-900'
                : selectedObsDetail.news2RiskTier === 'MEDIUM' || selectedObsDetail.news2RiskTier === 'LOW_MEDIUM'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="font-bold uppercase tracking-wider text-[11px]">
                RCP Clinical Escalation Recommendation
              </div>
              <p className="mt-1 text-xs leading-relaxed">
                {calculateNEWS2(selectedObsDetail).clinicalResponse}
              </p>
            </div>

            {/* Subscore Table */}
            <div className="border border-slate-200 rounded-bji overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2 px-3 text-left">Parameter</th>
                    <th className="py-2 px-3 text-left">Observed Value</th>
                    <th className="py-2 px-3 text-center">Score</th>
                    <th className="py-2 px-3 text-left">RCP Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculateNEWS2(selectedObsDetail).breakdown.map((b, idx) => (
                    <tr key={idx} className={b.score > 0 ? "bg-amber-50/40" : ""}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{b.parameter}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{b.value}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          b.score === 3 ? 'bg-red-600 text-white' :
                          b.score === 2 ? 'bg-orange-500 text-white' :
                          b.score === 1 ? 'bg-amber-400 text-slate-900' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          +{b.score}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">{b.scoringRationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedObsDetail(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
