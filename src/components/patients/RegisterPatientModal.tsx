"use client";

import React, { useState } from "react";
import { useHospital } from "@/lib/state/hospital-store";
import { Patient, AllergySeverity, AllergyCategory, PatientAllergy } from "@/types/hospital";
import { 
  UserPlus, 
  BedDouble, 
  Activity, 
  ShieldAlert, 
  Heart, 
  MapPin, 
  Phone, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { Button, Input, Select, Badge, Alert } from "@/components/ui";

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientRegistered?: (patient: Patient) => void;
}

export const RegisterPatientModal: React.FC<RegisterPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientRegistered
}) => {
  const { activeFacility, departments, beds, registerPatient } = useHospital();

  // Demographics
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<"M" | "F" | "OTHER">("M");
  const [bloodType, setBloodType] = useState<any>("O_POS");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Emergency Contact
  const [emergName, setEmergName] = useState("");
  const [emergRel, setEmergRel] = useState("");
  const [emergPhone, setEmergPhone] = useState("");

  // Clinical Intake & Encounter
  const [encounterType, setEncounterType] = useState<"INPATIENT" | "EMERGENCY" | "OUTPATIENT">("INPATIENT");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [assignedBedId, setAssignedBedId] = useState("");
  const [activeConditions, setActiveConditions] = useState("");
  const [initialAllergen, setInitialAllergen] = useState("");
  const [initialAllergyReaction, setInitialAllergyReaction] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Available beds in the active facility
  const availableBeds = beds.filter(b => b.status === "AVAILABLE");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Patient first and last name are required.");
      return;
    }
    if (!dob) {
      setError("Patient date of birth is required.");
      return;
    }

    try {
      const allergiesList: PatientAllergy[] = initialAllergen.trim() ? [
        {
          id: `AllergyIntolerance/all-${Date.now().toString().slice(-4)}`,
          allergen: initialAllergen.trim(),
          category: 'MEDICATION',
          reaction: initialAllergyReaction.trim() || 'Hypersensitivity Reaction',
          severity: 'SEVERE',
          verificationStatus: 'CONFIRMED',
          recordedAt: new Date().toISOString(),
          recordedBy: 'Practitioner/attending',
          version: 1
        }
      ] : [];

      const registered = registerPatient({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dob,
        sex,
        bloodType,
        phone: phone.trim() || "+1 (555) 302-9988",
        address: address.trim() || "120 Main Street, Springfield",
        emergencyContact: {
          name: emergName.trim() || "Next of Kin",
          relationship: emergRel.trim() || "Spouse",
          phone: emergPhone.trim() || "+1 (555) 302-9989"
        },
        allergies: allergiesList,
        activeConditions: activeConditions ? activeConditions.split(",").map(c => c.trim()).filter(Boolean) : [],
        primaryLanguage: "English",
        initialEncounterType: encounterType,
        assignedBedId: assignedBedId || undefined,
        presentingComplaint: chiefComplaint.trim() || undefined
      });

      setSuccess(`Patient ${registered.lastName}, ${registered.firstName} admitted with MRN: ${registered.mrn}`);
      if (onPatientRegistered) {
        onPatientRegistered(registered);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to register patient.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bji-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-bji border border-bji-slate-300 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-bji-slate-900 text-white flex items-center justify-between border-b border-bji-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-bji-sm bg-bji-green-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Clinical Patient Registration &amp; Admission</h2>
              <p className="text-[11px] text-bji-slate-300">
                Direct intake at {activeFacility.name} ({activeFacility.mrnPrefix})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-bji-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <Alert tone="danger" title="Validation Error">
              {error}
            </Alert>
          )}

          {success && (
            <Alert tone="success" title="Intake Established">
              {success} Closing modal and focusing chart...
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Demographics */}
            <div className="border border-bji-slate-200 rounded-bji p-3.5 bg-bji-slate-50/50 space-y-3">
              <span className="font-bold text-bji-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wide border-b border-bji-slate-200 pb-2">
                <Heart className="w-3.5 h-3.5 text-bji-green-700" />
                1. Patient Demographics &amp; Identity
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    First Name <span className="text-bji-red-600">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Robert"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Last Name <span className="text-bji-red-600">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Sterling"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Date of Birth <span className="text-bji-red-600">*</span>
                  </label>
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Legal Sex</label>
                  <Select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="OTHER">Other / Non-Binary</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Blood Type</label>
                  <Select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                  >
                    <option value="O_POS">O Positive (O+)</option>
                    <option value="O_NEG">O Negative (O-)</option>
                    <option value="A_POS">A Positive (A+)</option>
                    <option value="A_NEG">A Negative (A-)</option>
                    <option value="B_POS">B Positive (B+)</option>
                    <option value="B_NEG">B Negative (B-)</option>
                    <option value="AB_POS">AB Positive (AB+)</option>
                    <option value="AB_NEG">AB Negative (AB-)</option>
                    <option value="UNKNOWN">Unknown / Not Typed</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Contact Phone</label>
                  <Input
                    placeholder="+1 (555) 012-3456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-bji-slate-700 font-semibold mb-1">Residential Address</label>
                  <Input
                    placeholder="742 Evergreen Terrace, Sector 4"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 2. Admission Encounter & Bed Placement */}
            <div className="border border-bji-slate-200 rounded-bji p-3.5 bg-bji-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-bji-slate-200 pb-2">
                <span className="font-bold text-bji-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                  <BedDouble className="w-3.5 h-3.5 text-bji-blue-700" />
                  2. Encounter Admission &amp; Ward Bed Placement
                </span>
                <Badge tone="info" size="xs">Connected Workflow</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Encounter Class</label>
                  <Select
                    value={encounterType}
                    onChange={(e) => setEncounterType(e.target.value as any)}
                  >
                    <option value="INPATIENT">Inpatient Admission</option>
                    <option value="EMERGENCY">Emergency / Trauma Arrival</option>
                    <option value="OUTPATIENT">Ambulatory Outpatient</option>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Presenting Complaint / Admitting Diagnosis
                  </label>
                  <Input
                    placeholder="e.g. Acute exacerbation of COPD with shortness of breath"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Assign Inpatient Bed ({availableBeds.length} Currently Available)
                  </label>
                  <Select
                    value={assignedBedId}
                    onChange={(e) => setAssignedBedId(e.target.value)}
                  >
                    <option value="">-- No Bed Assigned Yet (Triage / Waiting) --</option>
                    {availableBeds.map((b) => {
                      const dept = departments.find(d => d.id === b.wardId);
                      return (
                        <option key={b.id} value={b.id}>
                          {b.roomNumber} - Bed {b.bedNumber} ({dept?.name || "General Ward"}) {(b.requiresTelemetry ?? b.telemetryEnabled) ? "[Telemetry]" : ""}
                        </option>
                      );
                    })}
                  </Select>
                  <p className="text-[10px] text-bji-slate-500 mt-1">
                    Selecting a bed will immediately transition its status to OCCUPIED and link it to the clinical flowsheet.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Medical History & Critical Allergies */}
            <div className="border border-bji-slate-200 rounded-bji p-3.5 bg-bji-slate-50/50 space-y-3">
              <span className="font-bold text-bji-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wide border-b border-bji-slate-200 pb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-bji-red-700" />
                3. Clinical History &amp; Critical Allergies
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Known Active Chronic Conditions (comma separated)
                  </label>
                  <Input
                    placeholder="e.g. Type 2 Diabetes, Hypertension, Coronary Artery Disease"
                    value={activeConditions}
                    onChange={(e) => setActiveConditions(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Documented Drug Allergen</label>
                  <Input
                    placeholder="e.g. Penicillin, Sulfa, Cephalexin"
                    value={initialAllergen}
                    onChange={(e) => setInitialAllergen(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Allergic Reaction Profile</label>
                  <Input
                    placeholder="e.g. Anaphylaxis, Diffuse Urticaria"
                    value={initialAllergyReaction}
                    onChange={(e) => setInitialAllergyReaction(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-bji-slate-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-bji-green-700 hover:bg-bji-green-800 text-white font-bold"
              >
                Complete Registration &amp; Open Encounter
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
