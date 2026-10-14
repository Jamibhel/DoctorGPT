"use client";

import React, { useState } from "react";
import { SurgicalCase, WhoChecklistSignIn, WhoChecklistTimeOut, WhoChecklistSignOut } from "@/types/hospital";
import { useHospital } from "@/lib/state/hospital-store";
import { 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Clock, 
  ShieldCheck, 
  FileCheck, 
  UserCheck, 
  CheckSquare, 
  Square,
  AlertCircle
} from "lucide-react";

interface WhoChecklistModalProps {
  surgicalCase: SurgicalCase;
  isOpen: boolean;
  onClose: () => void;
}

export const WhoChecklistModal: React.FC<WhoChecklistModalProps> = ({
  surgicalCase,
  isOpen,
  onClose
}) => {
  const { updateWhoChecklist, currentStaff } = useHospital();
  const [activePhase, setActivePhase] = useState<'signIn' | 'timeOut' | 'signOut'>('timeOut');

  // Form states initialized from case data
  const [signInChecks, setSignInChecks] = useState<WhoChecklistSignIn>({
    ...surgicalCase.checklist.signIn
  });
  const [timeOutChecks, setTimeOutChecks] = useState<WhoChecklistTimeOut>({
    ...surgicalCase.checklist.timeOut
  });
  const [signOutChecks, setSignOutChecks] = useState<WhoChecklistSignOut>({
    ...surgicalCase.checklist.signOut
  });

  const [antibioticName, setAntibioticName] = useState<string>(
    surgicalCase.checklist.timeOut.antibioticGivenName || "Cefazolin 2g IV"
  );

  if (!isOpen) return null;

  const handleToggleSignIn = (key: keyof WhoChecklistSignIn) => {
    setSignInChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleTimeOut = (key: keyof WhoChecklistTimeOut) => {
    setTimeOutChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleSignOut = (key: keyof WhoChecklistSignOut) => {
    setSignOutChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSignIn = () => {
    updateWhoChecklist(surgicalCase.id, 'signIn', signInChecks);
    setActivePhase('timeOut');
  };

  const handleSaveTimeOut = () => {
    updateWhoChecklist(surgicalCase.id, 'timeOut', {
      ...timeOutChecks,
      antibioticGivenName: antibioticName
    });
    setActivePhase('signOut');
  };

  const handleSaveSignOut = () => {
    updateWhoChecklist(surgicalCase.id, 'signOut', signOutChecks);
    onClose();
  };

  // Completion calculation
  const signInComplete = 
    signInChecks.patientConfirmed && 
    signInChecks.siteMarked && 
    signInChecks.anesthesiaSafetyCheck && 
    signInChecks.pulseOximeterFunctioning && 
    signInChecks.allergyCheck;

  const timeOutComplete = 
    timeOutChecks.teamIntroduced && 
    timeOutChecks.verbalConfirmationPatientSiteProcedure && 
    timeOutChecks.surgeonCriticalEventsReviewed && 
    timeOutChecks.anesthesiaConcernsReviewed && 
    timeOutChecks.nursingSterilityIndicatorsConfirmed && 
    timeOutChecks.antibioticProphylaxisWithin60Min;

  const signOutComplete = 
    signOutChecks.procedureNameRecorded && 
    signOutChecks.instrumentCountsCorrect && 
    signOutChecks.spongeCountsCorrect && 
    signOutChecks.needleCountsCorrect && 
    signOutChecks.specimenLabeledCorrectly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-bji shadow-2xl border border-[#D7DEE7] w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                WHO Surgical Safety Checklist Protocol
              </h2>
              <p className="text-[11px] text-slate-300 font-mono">
                {surgicalCase.operatingRoom} • {surgicalCase.procedureName} • Patient: {surgicalCase.patientName} ({surgicalCase.mrn})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-[#D7DEE7] bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActivePhase('signIn')}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-r border-[#D7DEE7] transition ${
              activePhase === 'signIn'
                ? 'bg-white text-emerald-800 border-b-2 border-b-emerald-600 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {signInComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">1</span>
            )}
            <span>Phase 1: SIGN IN</span>
            <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(Before Induction)</span>
          </button>

          <button
            onClick={() => setActivePhase('timeOut')}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-r border-[#D7DEE7] transition ${
              activePhase === 'timeOut'
                ? 'bg-white text-blue-800 border-b-2 border-b-blue-600 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {timeOutComplete ? (
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">2</span>
            )}
            <span>Phase 2: TIME OUT</span>
            <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(Before Incision)</span>
          </button>

          <button
            onClick={() => setActivePhase('signOut')}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition ${
              activePhase === 'signOut'
                ? 'bg-white text-purple-800 border-b-2 border-b-purple-600 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {signOutComplete ? (
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">3</span>
            )}
            <span>Phase 3: SIGN OUT</span>
            <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(Before Leaving OR)</span>
          </button>
        </div>

        {/* Phase Content Area */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">

          {/* PHASE 1: SIGN IN */}
          {activePhase === 'signIn' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-bji p-3.5 flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>
                    <strong>Sign In (Before Induction of Anesthesia):</strong> Conducted with patient awake (if possible), nurse, and anesthetist.
                  </span>
                </div>
                {surgicalCase.checklist.signIn.verifiedAt && (
                  <span className="font-mono text-[11px] text-emerald-700">
                    Verified: {new Date(surgicalCase.checklist.signIn.verifiedAt).toLocaleTimeString()} by {surgicalCase.checklist.signIn.verifiedBy}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <label 
                  onClick={() => handleToggleSignIn('patientConfirmed')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    signInChecks.patientConfirmed ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signInChecks.patientConfirmed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Identity, Site, Procedure &amp; Consent Confirmed</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Patient has verbally confirmed identity, surgical site, and operative consent signed.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleSignIn('siteMarked')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    signInChecks.siteMarked ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signInChecks.siteMarked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Surgical Site Marked</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Site marked by operating surgeon with indelible marker / or not applicable.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleSignIn('anesthesiaSafetyCheck')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    signInChecks.anesthesiaSafetyCheck ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signInChecks.anesthesiaSafetyCheck ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Anesthesia Safety Machine &amp; Meds Checked</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Machine circuit, suction, vaporizers, emergency drugs verified ready.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleSignIn('pulseOximeterFunctioning')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    signInChecks.pulseOximeterFunctioning ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signInChecks.pulseOximeterFunctioning ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Pulse Oximeter Placed &amp; Functioning</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Continuous pulse oximetry plethysmograph waveform confirmed.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleSignIn('allergyCheck')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    signInChecks.allergyCheck ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signInChecks.allergyCheck ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Allergy History Verified</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Known medication, latex, and antiseptic allergies checked against chart.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleSignIn('difficultAirwayRisk')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    signInChecks.difficultAirwayRisk ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signInChecks.difficultAirwayRisk ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Difficult Airway / Aspiration Risk Assessed</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Video laryngoscope &amp; emergency airway cart verified immediately available.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleSignIn('bloodLossRiskOver500ml')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition md:col-span-2 ${
                    signInChecks.bloodLossRiskOver500ml ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signInChecks.bloodLossRiskOver500ml ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Risk of &gt;500 mL Blood Loss Planned (7 mL/kg in children)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Large bore IV access / central line secured and blood products typed &amp; crossed or banked.</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#D7DEE7]">
                <button
                  onClick={handleSaveSignIn}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-bji shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Sign In &amp; Proceed to Time Out</span>
                </button>
              </div>
            </div>
          )}

          {/* PHASE 2: TIME OUT */}
          {activePhase === 'timeOut' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-bji p-3.5 flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>
                    <strong>Time Out (Immediately Before Skin Incision):</strong> Entire surgical team pause. Verbal confirmation led by surgeon or circulating nurse.
                  </span>
                </div>
                {surgicalCase.checklist.timeOut.verifiedAt && (
                  <span className="font-mono text-[11px] text-blue-700">
                    Verified: {new Date(surgicalCase.checklist.timeOut.verifiedAt).toLocaleTimeString()} by {surgicalCase.checklist.timeOut.verifiedBy}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <label 
                  onClick={() => handleToggleTimeOut('teamIntroduced')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    timeOutChecks.teamIntroduced ? 'bg-blue-50/60 border-blue-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {timeOutChecks.teamIntroduced ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">All Team Members Introduced by Name &amp; Role</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Surgeon, anesthesia provider, scrub tech, circulating nurse identified.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleTimeOut('verbalConfirmationPatientSiteProcedure')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    timeOutChecks.verbalConfirmationPatientSiteProcedure ? 'bg-blue-50/60 border-blue-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {timeOutChecks.verbalConfirmationPatientSiteProcedure ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Verbal Confirmation: Patient, Site &amp; Procedure</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Unanimous agreement across surgical, anesthetic, and nursing staff.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleTimeOut('surgeonCriticalEventsReviewed')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    timeOutChecks.surgeonCriticalEventsReviewed ? 'bg-blue-50/60 border-blue-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {timeOutChecks.surgeonCriticalEventsReviewed ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Surgeon Review of Critical Steps &amp; Blood Loss</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Anticipated duration, difficult anatomy, and contingency plan reviewed.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleTimeOut('anesthesiaConcernsReviewed')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    timeOutChecks.anesthesiaConcernsReviewed ? 'bg-blue-50/60 border-blue-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {timeOutChecks.anesthesiaConcernsReviewed ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Anesthesia Concerns &amp; ASA Score Reviewed</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Hemodynamic stability, line placements, and recovery disposition reviewed.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleTimeOut('nursingSterilityIndicatorsConfirmed')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    timeOutChecks.nursingSterilityIndicatorsConfirmed ? 'bg-blue-50/60 border-blue-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {timeOutChecks.nursingSterilityIndicatorsConfirmed ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Nursing Sterility &amp; Equipment Indicators</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Autoclave indicators verified, instrument trays intact, implants ready.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleTimeOut('essentialImagingDisplayed')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    timeOutChecks.essentialImagingDisplayed ? 'bg-blue-50/60 border-blue-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {timeOutChecks.essentialImagingDisplayed ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Essential Diagnostic Imaging Displayed</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Relevant CT/MRI/X-rays loaded onto OR monitor banks and oriented correctly.</p>
                  </div>
                </label>
              </div>

              {/* Antibiotic Prophylaxis Bar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-bji space-y-2">
                <div className="flex items-center justify-between">
                  <label 
                    onClick={() => handleToggleTimeOut('antibioticProphylaxisWithin60Min')}
                    className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-900"
                  >
                    {timeOutChecks.antibioticProphylaxisWithin60Min ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Antibiotic Prophylaxis Administered Within Last 60 Minutes</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">SCIP Infusion Standard</span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-xs text-slate-600 font-medium">Antibiotic Agent &amp; Dose:</span>
                  <input
                    type="text"
                    value={antibioticName}
                    onChange={(e) => setAntibioticName(e.target.value)}
                    placeholder="e.g. Cefazolin 2g IV"
                    className="text-xs px-2.5 py-1 border border-slate-300 rounded bg-white font-mono flex-1 max-w-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#D7DEE7]">
                <button
                  onClick={handleSaveTimeOut}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-bji shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Attest Time Out &amp; Allow Incision</span>
                </button>
              </div>
            </div>
          )}

          {/* PHASE 3: SIGN OUT */}
          {activePhase === 'signOut' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-bji p-3.5 flex items-center justify-between text-xs text-purple-900">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-purple-700" />
                  <span>
                    <strong>Sign Out (Before Patient Leaves Operating Room):</strong> Nurse, anesthesiologist, and surgeon review.
                  </span>
                </div>
                {surgicalCase.checklist.signOut.verifiedAt && (
                  <span className="font-mono text-[11px] text-purple-700">
                    Verified: {new Date(surgicalCase.checklist.signOut.verifiedAt).toLocaleTimeString()} by {surgicalCase.checklist.signOut.verifiedBy}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <label 
                  onClick={() => handleToggleSignOut('procedureNameRecorded')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    signOutChecks.procedureNameRecorded ? 'bg-purple-50/60 border-purple-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signOutChecks.procedureNameRecorded ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Name of the Procedure Recorded Accurately</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Confirmed exact operative procedure description for operative note.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleSignOut('instrumentCountsCorrect')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    signOutChecks.instrumentCountsCorrect ? 'bg-purple-50/60 border-purple-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signOutChecks.instrumentCountsCorrect ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Instrument Count Reconciled &amp; Correct</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">All retractor blades, forceps, and clamp counts verified match baseline.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleSignOut('spongeCountsCorrect')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    signOutChecks.spongeCountsCorrect ? 'bg-purple-50/60 border-purple-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signOutChecks.spongeCountsCorrect ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Sponge / Raytec / Lap Pad Counts Correct</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">All radiopaque sponges accounted for and inspected prior to closure.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleSignOut('needleCountsCorrect')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    signOutChecks.needleCountsCorrect ? 'bg-purple-50/60 border-purple-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signOutChecks.needleCountsCorrect ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Needle &amp; Sharp Counts Correct</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">All suture needles, knife blades, and cautery tips verified in magnetic box.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleSignOut('specimenLabeledCorrectly')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    signOutChecks.specimenLabeledCorrectly ? 'bg-purple-50/60 border-purple-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signOutChecks.specimenLabeledCorrectly ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Specimen Labeled Correctly (Read Aloud)</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Pathology specimen verified with patient two-identifier check and anatomic source.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleSignOut('equipmentIssuesAddressed')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition ${
                    signOutChecks.equipmentIssuesAddressed ? 'bg-purple-50/60 border-purple-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signOutChecks.equipmentIssuesAddressed ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Equipment Problems / Failures Addressed</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Any biomedical malfunction documented and tagged for sterile reprocessing / bio-eng.</p>
                  </div>
                </label>

                <label 
                  onClick={() => handleToggleSignOut('keyConcernsRecoveryReviewed')}
                  className={`p-3 rounded-bji border cursor-pointer flex items-start gap-3 transition md:col-span-2 ${
                    signOutChecks.keyConcernsRecoveryReviewed ? 'bg-purple-50/60 border-purple-300' : 'bg-white border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {signOutChecks.keyConcernsRecoveryReviewed ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Key Recovery &amp; PACU Concerns Reviewed</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Surgeon, anesthesia, and nurse review airway extubation, pain plan, and post-op destination.</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#D7DEE7]">
                <button
                  onClick={handleSaveSignOut}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-bji shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sign Out Completed &amp; Authorize PACU Transfer</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Attestation */}
        <div className="bg-slate-100 px-5 py-3 border-t border-[#D7DEE7] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="text-[10px] font-mono bg-white px-2 py-0.5 border border-slate-300 rounded">
              Active Attestor: {currentStaff.name} ({currentStaff.role})
            </span>
            <span className="text-[11px] text-slate-500">
              Audit log recorded per BJI perioperative quality mandate.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-[#D7DEE7] hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-bji"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
