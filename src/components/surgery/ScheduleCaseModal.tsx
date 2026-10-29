"use client";

import React, { useState } from "react";
import { SurgicalCase, AsaClassification } from "@/types/hospital";
import { useHospital } from "@/lib/state/hospital-store";
import { X, Calendar, Plus, Clock, User, Stethoscope } from "lucide-react";

interface ScheduleCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleCaseModal: React.FC<ScheduleCaseModalProps> = ({
  isOpen,
  onClose
}) => {
  const { patients, scheduleSurgicalCase, currentStaff } = useHospital();

  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || "");
  const [operatingRoom, setOperatingRoom] = useState<string>("OR 1 (General/Trauma)");
  const [procedureName, setProcedureName] = useState<string>("");
  const [specialty, setSpecialty] = useState<SurgicalCase['specialty']>("GENERAL");
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [surgeon, setSurgeon] = useState<string>(currentStaff.name || "Dr. Allison Cameron, MD");
  const [anesthesiologist, setAnesthesiologist] = useState<string>("Dr. Robert Chase, MD");
  const [asaScore, setAsaScore] = useState<AsaClassification>("ASA_II");
  const [anesthesiaType, setAnesthesiaType] = useState<any>("GENERAL");
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === selectedPatientId) || patients[0];
    if (!patient || !procedureName.trim()) return;

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    scheduleSurgicalCase({
      operatingRoom,
      patientId: patient.id,
      patientName: `${patient.lastName}, ${patient.firstName}`,
      mrn: patient.mrn,
      procedureName,
      specialty,
      scheduledStartTime: startTime.toISOString(),
      scheduledEndTime: endTime.toISOString(),
      estimatedDurationMinutes: durationMinutes,
      status: "SCHEDULED",
      notes,
      checklist: {
        signIn: {
          patientConfirmed: false,
          siteMarked: false,
          anesthesiaSafetyCheck: false,
          pulseOximeterFunctioning: false,
          allergyCheck: false,
          difficultAirwayRisk: false,
          bloodLossRiskOver500ml: false
        },
        timeOut: {
          teamIntroduced: false,
          verbalConfirmationPatientSiteProcedure: false,
          surgeonCriticalEventsReviewed: false,
          anesthesiaConcernsReviewed: false,
          nursingSterilityIndicatorsConfirmed: false,
          antibioticProphylaxisWithin60Min: false,
          antibioticGivenName: "Cefazolin 2g IV",
          essentialImagingDisplayed: false
        },
        signOut: {
          procedureNameRecorded: false,
          instrumentCountsCorrect: false,
          spongeCountsCorrect: false,
          needleCountsCorrect: false,
          specimenLabeledCorrectly: false,
          equipmentIssuesAddressed: false,
          keyConcernsRecoveryReviewed: false
        },
        isCompleted: false
      },
      intraoperative: {
        anesthesiaType,
        asaScore,
        primarySurgeon: surgeon,
        anesthesiologist,
        scrubNurse: "Sarah Jenkins, RN",
        circulatingNurse: "Amanda Vaughn, RN",
        eblMl: 50,
        urineOutputMl: 100,
        crystalloidsMl: 1000,
        colloidsMl: 0,
        bloodProductsTransfused: "None",
        gasAgent: "Sevoflurane 1.8%",
        spongeCountInitial: 10,
        spongeCountAdded: 0,
        spongeCountFinal: 10,
        needleCountInitial: 5,
        needleCountAdded: 0,
        needleCountFinal: 5,
        instrumentCountInitial: 42,
        instrumentCountFinal: 42,
        countsReconciled: true,
        postOpDestination: "PACU"
      }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-bji shadow-2xl border border-[#D7DEE7] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">Schedule New Surgical Case</h2>
              <p className="text-[11px] text-slate-300">Book Operating Theatre suite and assign perioperative team</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Operating Suite</label>
              <select
                value={operatingRoom}
                onChange={(e) => setOperatingRoom(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white font-medium text-slate-800"
              >
                <option value="OR 1 (General/Trauma)">OR 1 (General / Trauma)</option>
                <option value="OR 2 (Orthopedics)">OR 2 (Orthopedics / Joint Replacement)</option>
                <option value="OR 3 (Cardiac/Vascular)">OR 3 (Cardiac &amp; Vascular Surgery)</option>
                <option value="OR 4 (Neurosurgery/Robotics)">OR 4 (Neurosurgery &amp; DaVinci Robotics)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">Surgical Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value as any)}
                className="w-full border border-slate-300 rounded p-2 bg-white font-medium text-slate-800"
              >
                <option value="GENERAL">General Surgery</option>
                <option value="ORTHO">Orthopedic Surgery</option>
                <option value="CARDIAC">Cardiothoracic Surgery</option>
                <option value="NEURO">Neurosurgery</option>
                <option value="UROLOGY">Urology</option>
                <option value="ENT">Otolaryngology (ENT)</option>
                <option value="PLASTICS">Plastic &amp; Reconstructive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">Patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 bg-white font-medium text-slate-800"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.lastName}, {p.firstName} (MRN: {p.mrn} • DOB: {p.dateOfBirth} • {p.sex})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">Procedure Name</label>
            <input
              type="text"
              required
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              placeholder="e.g. Laparoscopic Appendectomy with Intra-op Cholangiogram"
              className="w-full border border-slate-300 rounded p-2 bg-white text-slate-800"
            >
            </input>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Duration (Mins)</label>
              <input
                type="number"
                min={15}
                max={600}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">ASA Class</label>
              <select
                value={asaScore}
                onChange={(e) => setAsaScore(e.target.value as AsaClassification)}
                className="w-full border border-slate-300 rounded p-1.5 bg-white font-bold font-mono"
              >
                <option value="ASA_I">ASA I</option>
                <option value="ASA_II">ASA II</option>
                <option value="ASA_III">ASA III</option>
                <option value="ASA_IV">ASA IV</option>
                <option value="ASA_IE">ASA I-E (Emergency)</option>
                <option value="ASA_IIE">ASA II-E (Emergency)</option>
                <option value="ASA_IIIE">ASA III-E (Emergency)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Anesthesia</label>
              <select
                value={anesthesiaType}
                onChange={(e) => setAnesthesiaType(e.target.value as any)}
                className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono"
              >
                <option value="GENERAL">General</option>
                <option value="SPINAL_EPIDURAL">Spinal/Epidural</option>
                <option value="REGIONAL_BLOCK">Regional Block</option>
                <option value="MAC_SEDATION">MAC Sedation</option>
                <option value="LOCAL">Local</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Primary Surgeon</label>
              <input
                type="text"
                value={surgeon}
                onChange={(e) => setSurgeon(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 bg-white"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Anesthesiologist</label>
              <input
                type="text"
                value={anesthesiologist}
                onChange={(e) => setAnesthesiologist(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Pre-Operative Notes / Implants Needed</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Type & Screen verified, C-arm fluoroscopy booked, prosthetic tray verified sterile..."
              className="w-full border border-slate-300 rounded p-2 bg-white font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D7DEE7]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-[#D7DEE7] hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-bji"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-bji shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Book Case in Theatre</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
