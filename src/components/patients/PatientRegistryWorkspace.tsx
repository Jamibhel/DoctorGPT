"use client";

import React, { useState } from "react";
import { useHospital } from "@/lib/state/hospital-store";
import { 
  Users, 
  Search, 
  UserPlus, 
  Building2, 
  ShieldAlert, 
  Phone, 
  Calendar, 
  MapPin, 
  Heart, 
  AlertCircle, 
  FileCheck2, 
  ArrowRight,
  ExternalLink,
  Plus
} from "lucide-react";
import { 
  Button, 
  Input, 
  Badge, 
  Alert, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  Dialog
} from "@/components/ui";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Patient, PatientAllergy, AllergySeverity, AllergyCategory } from "@/types/hospital";

export const PatientRegistryWorkspace: React.FC = () => {
  const { 
    patients, 
    activePatientId, 
    activeFacility, 
    setActivePatientId, 
    searchPatientsGlobal,
    registerPatient,
    updatePatientDemographics,
    updatePatientAllergy
  } = useHospital();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [crossFacilityMode, setCrossFacilityMode] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  // Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regSex, setRegSex] = useState<"M" | "F" | "OTHER">("M");
  const [regBloodType, setRegBloodType] = useState<any>("UNKNOWN");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regEmergName, setRegEmergName] = useState("");
  const [regEmergRel, setRegEmergRel] = useState("");
  const [regEmergPhone, setRegEmergPhone] = useState("");
  const [regConditions, setRegConditions] = useState("");

  // Allergy Modal State
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [targetPatientForEdit, setTargetPatientForEdit] = useState<Patient | null>(null);
  const [newAllergen, setNewAllergen] = useState("");
  const [newReaction, setNewReaction] = useState("");
  const [newSeverity, setNewSeverity] = useState<AllergySeverity>("MODERATE");
  const [newCategory, setNewCategory] = useState<AllergyCategory>("MEDICATION");

  // Compute Active Patient List: Facility Scoped vs Cross-Facility EMPI
  const displayedPatients = crossFacilityMode
    ? searchPatientsGlobal(searchQuery)
    : patients
        .filter((p) => {
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          return (
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
            p.mrn.toLowerCase().includes(query) ||
            p.phone.includes(query) ||
            p.dateOfBirth.includes(query)
          );
        })
        .map((p) => ({ patient: p, facility: activeFacility }));

  // Handle Patient Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName.trim() || !regLastName.trim() || !regDob) return;

    const newPat = registerPatient({
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      dateOfBirth: regDob,
      sex: regSex,
      bloodType: regBloodType,
      phone: regPhone.trim() || "+1 (555) 000-0000",
      address: regAddress.trim() || "Address on File",
      emergencyContact: {
        name: regEmergName.trim() || "Emergency Contact",
        relationship: regEmergRel.trim() || "Spouse / Relative",
        phone: regEmergPhone.trim() || "+1 (555) 000-0000"
      },
      allergies: [],
      activeConditions: regConditions ? regConditions.split(",").map(c => c.trim()).filter(Boolean) : [],
      primaryLanguage: "English"
    });

    setIsRegisterModalOpen(false);
    setRegistrationSuccess(`Successfully registered ${newPat.firstName} ${newPat.lastName} with MRN: ${newPat.mrn}`);
    setTimeout(() => setRegistrationSuccess(null), 5000);

    // Reset Form
    setRegFirstName("");
    setRegLastName("");
    setRegDob("");
    setRegPhone("");
    setRegAddress("");
    setRegEmergName("");
    setRegEmergRel("");
    setRegEmergPhone("");
    setRegConditions("");
  };

  // Handle Allergy Addition
  const handleAddAllergySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPatientForEdit || !newAllergen.trim()) return;

    const allergy: PatientAllergy = {
      id: `AllergyIntolerance/all-${Date.now().toString().slice(-4)}`,
      allergen: newAllergen.trim(),
      category: newCategory,
      reaction: newReaction.trim() || "Clinical Reaction Documented",
      severity: newSeverity,
      verificationStatus: "CONFIRMED",
      recordedAt: new Date().toISOString(),
      recordedBy: "Practitioner/attending",
      version: 1
    };

    updatePatientAllergy(allergy);
    setIsAllergyModalOpen(false);
    setNewAllergen("");
    setNewReaction("");
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* 1. Header with EMPI Search & Register Button */}
      <div className="bg-white p-4 rounded-bji border border-bji-slate-300 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-bji-sm bg-bji-green-50 text-bji-green-800 border border-bji-green-200">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-bji-slate-900 leading-tight">
                  Patient Registry &amp; Demographics
                </h1>
                <Badge tone="neutral" size="xs">
                  {crossFacilityMode ? "Global EMPI Mode" : `${activeFacility.code} Tenant`}
                </Badge>
              </div>
              <p className="text-meta text-bji-slate-500 mt-0.5">
                Enterprise Master Patient Index with cross-facility identification &amp; allergy safety records
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 px-2 py-1 bg-bji-slate-50 border border-bji-slate-300 rounded-bji text-meta cursor-pointer font-medium text-bji-slate-700">
            <input
              type="checkbox"
              checked={crossFacilityMode}
              onChange={(e) => setCrossFacilityMode(e.target.checked)}
              className="rounded text-bji-green-700"
            />
            <span>Cross-Facility EMPI Search</span>
          </label>

          <PermissionGate permission="patients:create">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRegisterModalOpen(true)}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Register New Patient
            </Button>
          </PermissionGate>
        </div>
      </div>

      {registrationSuccess && (
        <Alert tone="success" title="Patient Registered Successfully">
          {registrationSuccess}
        </Alert>
      )}

      {/* 2. Search Toolbar */}
      <div className="bg-white p-3 rounded-bji border border-bji-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-bji-slate-400 absolute left-2.5 top-2.5" />
          <Input
            placeholder={
              crossFacilityMode 
                ? "Search global EMPI by name, MRN, DOB, or phone..." 
                : "Search local patients by name, MRN, or DOB..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>

        <div className="text-meta text-bji-slate-500 font-mono">
          Showing <strong>{displayedPatients.length}</strong> patient records
        </div>
      </div>

      {/* 3. Patients Roster Table */}
      <div className="bg-white rounded-bji border border-bji-slate-200 shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient &amp; MRN</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>DOB &amp; Demographics</TableHead>
              <TableHead>Contact &amp; Emergency</TableHead>
              <TableHead>Documented Allergies</TableHead>
              <TableHead>Active Conditions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedPatients.map(({ patient, facility }) => {
              const isSelected = patient.id === activePatientId;
              const hasAllergies = patient.allergies && patient.allergies.length > 0;

              return (
                <TableRow key={patient.id} className={isSelected ? "bg-bji-green-50/50" : ""}>
                  <TableCell>
                    <div>
                      <div className="font-bold text-bji-slate-900 flex items-center gap-1.5">
                        <span>{patient.lastName}, {patient.firstName}</span>
                        {isSelected && (
                          <Badge tone="success" size="xs">Selected</Badge>
                        )}
                      </div>
                      <div className="font-mono text-meta text-bji-slate-500">
                        {patient.mrn}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1 text-meta">
                      <Building2 className="w-3.5 h-3.5 text-bji-slate-400 shrink-0" />
                      <span className="font-semibold text-bji-slate-800 truncate max-w-[140px]">
                        {facility.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-meta">
                    <div>
                      <span>DOB: <strong className="font-mono text-bji-slate-800">{patient.dateOfBirth}</strong></span>
                      <span className="text-bji-slate-400 block font-mono">
                        Sex: {patient.sex} • Blood: {patient.bloodType}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-meta">
                    <div>
                      <span className="text-bji-slate-800 font-mono block">{patient.phone}</span>
                      <span className="text-[10px] text-bji-slate-500">
                        ICE: {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      {hasAllergies ? (
                        patient.allergies.map((a) => (
                          <span 
                            key={a.id} 
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-bji-xs bg-bji-red-50 text-bji-red-800 border border-bji-red-200 text-[10px] font-bold"
                            title={`v${a.version}: ${a.reaction} (${a.severity})`}
                          >
                            <ShieldAlert className="w-2.5 h-2.5 text-bji-red-600" />
                            {a.allergen} (v{a.version})
                          </span>
                        ))
                      ) : (
                        <span className="text-meta text-bji-slate-400 font-mono">NKDA</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-meta">
                    <div className="truncate max-w-[160px] text-bji-slate-600" title={patient.activeConditions.join(', ')}>
                      {patient.activeConditions.length > 0 
                        ? patient.activeConditions.join(', ') 
                        : "None recorded"}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant={isSelected ? "secondary" : "outline"}
                        size="xs"
                        onClick={() => setActivePatientId(patient.id)}
                      >
                        {isSelected ? "Active" : "Select"}
                      </Button>

                      <PermissionGate permission="chart:write_notes">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setTargetPatientForEdit(patient);
                            setIsAllergyModalOpen(true);
                          }}
                          className="text-bji-red-700 hover:bg-bji-red-50"
                          title="Record / Version Allergy"
                        >
                          + Allergy
                        </Button>
                      </PermissionGate>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* MODAL 1: Register New Patient */}
      <Dialog
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New Patient"
        subtitle={`Generates unique MRN with ${activeFacility.mrnPrefix} facility prefix`}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="xs" onClick={() => setIsRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="register-patient-form" variant="primary" size="xs">
              Complete Registration
            </Button>
          </div>
        }
      >
        <form id="register-patient-form" onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">First Name</label>
              <Input
                placeholder="e.g. Eleanor"
                value={regFirstName}
                onChange={(e) => setRegFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Last Name</label>
              <Input
                placeholder="e.g. Vance"
                value={regLastName}
                onChange={(e) => setRegLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Date of Birth</label>
              <Input
                type="date"
                value={regDob}
                onChange={(e) => setRegDob(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Biological Sex</label>
              <select
                value={regSex}
                onChange={(e) => setRegSex(e.target.value as any)}
                className="w-full h-8 px-2 bg-white border border-bji-slate-300 rounded-bji-xs text-xs font-semibold"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="OTHER">Other / Non-Binary</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Blood Type</label>
              <select
                value={regBloodType}
                onChange={(e) => setRegBloodType(e.target.value as any)}
                className="w-full h-8 px-2 bg-white border border-bji-slate-300 rounded-bji-xs text-xs font-semibold"
              >
                <option value="UNKNOWN">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Contact Phone</label>
              <Input
                placeholder="+1 (555) 000-0000"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Residential Address</label>
              <Input
                placeholder="Street address, City, State ZIP"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="border-t border-bji-slate-200 pt-3">
            <h4 className="font-semibold text-bji-slate-800 mb-2">Emergency Contact Information</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-meta text-bji-slate-600 mb-0.5">Contact Name</label>
                <Input
                  placeholder="e.g. Marcus Vance"
                  value={regEmergName}
                  onChange={(e) => setRegEmergName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-meta text-bji-slate-600 mb-0.5">Relationship</label>
                <Input
                  placeholder="e.g. Spouse"
                  value={regEmergRel}
                  onChange={(e) => setRegEmergRel(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-meta text-bji-slate-600 mb-0.5">Contact Phone</label>
                <Input
                  placeholder="+1 (555) 111-2222"
                  value={regEmergPhone}
                  onChange={(e) => setRegEmergPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-bji-slate-700 mb-1">Known Diagnoses / Conditions (Comma-separated)</label>
            <Input
              placeholder="e.g. Essential Hypertension, Type 2 Diabetes Mellitus"
              value={regConditions}
              onChange={(e) => setRegConditions(e.target.value)}
            />
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: Record / Version Patient Allergy */}
      <Dialog
        isOpen={isAllergyModalOpen}
        onClose={() => setIsAllergyModalOpen(false)}
        title="Document / Version Patient Allergy"
        subtitle={targetPatientForEdit ? `For: ${targetPatientForEdit.firstName} ${targetPatientForEdit.lastName} (${targetPatientForEdit.mrn})` : ""}
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="xs" onClick={() => setIsAllergyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-allergy-form" variant="danger" size="xs">
              Commit Allergy Record
            </Button>
          </div>
        }
      >
        <form id="add-allergy-form" onSubmit={handleAddAllergySubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-bji-slate-700 mb-1">Allergen / Substance</label>
            <Input
              placeholder="e.g. Penicillin, Sulfa, Peanuts"
              value={newAllergen}
              onChange={(e) => setNewAllergen(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Substance Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full h-8 px-2 bg-white border border-bji-slate-300 rounded-bji-xs text-xs font-semibold"
              >
                <option value="MEDICATION">Medication</option>
                <option value="FOOD">Food</option>
                <option value="ENVIRONMENTAL">Environmental</option>
                <option value="BIOLOGICAL">Biological</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-bji-slate-700 mb-1">Clinical Severity</label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as any)}
                className="w-full h-8 px-2 bg-white border border-bji-slate-300 rounded-bji-xs text-xs font-semibold"
              >
                <option value="MILD">Mild</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
                <option value="LIFE_THREATENING">Life-Threatening / Anaphylaxis</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-bji-slate-700 mb-1">Manifested Clinical Reaction</label>
            <Input
              placeholder="e.g. Urticaria, Facial angioedema, Bronchospasm"
              value={newReaction}
              onChange={(e) => setNewReaction(e.target.value)}
              required
            />
          </div>

          <div className="p-2.5 bg-bji-red-50 border border-bji-red-200 rounded-bji text-meta text-bji-red-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-bji-red-700 shrink-0" />
            <span>This record directly feeds the CDS Safety Engine for drug-allergy cross-checking during CPOE ordering.</span>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
