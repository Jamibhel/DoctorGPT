"use client";

import React, { useState } from "react";
import { useSession } from "@/lib/auth/session-context";
import { useHospital } from "@/lib/state/hospital-store";
import { 
  Button, 
  Input, 
  Select, 
  Badge, 
  Alert, 
  Tabs, 
  TabList, 
  TabTrigger, 
  TabContent 
} from "@/components/ui";
import { 
  Building2, 
  Lock, 
  Mail, 
  ShieldCheck, 
  User, 
  KeyRound, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({ isOpen, onClose }) => {
  const { loginStaff, loginPatient, switchUser } = useSession();
  const { facilities, activeFacilityId, switchFacility } = useHospital();

  const [activeTab, setActiveTab] = useState("staff");
  const [selectedFacilityId, setSelectedFacilityId] = useState(activeFacilityId);

  // Staff Form
  const [staffEmail, setStaffEmail] = useState("a.thorne@bjihospital.org");
  const [staffPin, setStaffPin] = useState("1234");
  const [staffError, setStaffError] = useState("");

  // Patient Form
  const [patientMrn, setPatientMrn] = useState("BJI-SJM-001001");
  const [patientDob, setPatientDob] = useState("1958-04-12");
  const [patientError, setPatientError] = useState("");

  if (!isOpen) return null;

  const handleFacilityChange = (facId: string) => {
    setSelectedFacilityId(facId);
    switchFacility(facId);
    if (facId === "fac-apex-valley") {
      setStaffEmail("j.hayes@apexvalleymed.org");
      setPatientMrn("BJI-APX-002001");
      setPatientDob("1984-06-15");
    } else if (facId === "fac-metro-diag") {
      setStaffEmail("n.drake@metrohealthdiag.org");
      setPatientMrn("BJI-MDC-003001");
      setPatientDob("1991-09-08");
    } else {
      setStaffEmail("a.thorne@bjihospital.org");
      setPatientMrn("BJI-SJM-001001");
      setPatientDob("1958-04-12");
    }
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError("");
    const success = loginStaff(staffEmail, staffPin, selectedFacilityId);
    if (success) {
      onClose();
    } else {
      setStaffError("Invalid staff credentials or PIN. (Default demo PIN: 1234)");
    }
  };

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPatientError("");
    const success = loginPatient(patientMrn, patientDob, selectedFacilityId);
    if (success) {
      onClose();
    } else {
      setPatientError("Patient record not found in this facility. Check MRN and Date of Birth.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bji-slate-900/70"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white border border-bji-slate-300 rounded-bji-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-bji-slate-900 text-white p-5 border-b border-bji-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-bji-sm bg-bji-green-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                +
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight">
                  BJI MediSupport — Secure Access Portal
                </h2>
                <p className="text-meta text-bji-slate-400">
                  Connected healthcare. One platform.
                </p>
              </div>
            </div>
            <Badge tone="success" size="xs" variant="solid">
              STAGE 4 RBAC
            </Badge>
          </div>
        </div>

        {/* Body Tabs */}
        <div className="p-5 space-y-4">
          {/* Facility Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-bji-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-bji-green-600" />
              <span>Select Healthcare Facility Tenant</span>
            </label>
            <select
              value={selectedFacilityId}
              onChange={(e) => handleFacilityChange(e.target.value)}
              className="w-full h-9 px-3 text-xs font-semibold text-bji-slate-900 bg-white border border-bji-slate-300 rounded-bji focus:outline-none focus:ring-1 focus:ring-bji-green-600"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.type.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabList variant="underline">
              <TabTrigger value="staff" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                Staff Workstation
              </TabTrigger>
              <TabTrigger value="patient" icon={<User className="w-3.5 h-3.5" />}>
                Patient Health Portal
              </TabTrigger>
            </TabList>

            {/* TAB 1: STAFF WORKSTATION LOGIN */}
            <TabContent value="staff" className="space-y-3 pt-3">
              <form onSubmit={handleStaffSubmit} className="space-y-3">
                <Input
                  label="Clinician Email"
                  type="email"
                  placeholder="name@bjihospital.org"
                  leftSlot={<Mail className="w-3.5 h-3.5" />}
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  required
                />

                <Input
                  label="Workstation PIN / Passcode"
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  leftSlot={<KeyRound className="w-3.5 h-3.5" />}
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value)}
                  hint="Default clinician PIN is 1234"
                  required
                />

                {staffError && (
                  <Alert severity="critical" title="Authentication Failed" description={staffError} />
                )}

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-meta text-bji-slate-500">
                    Encrypted Shared Terminal Session
                  </span>
                  <Button variant="primary" size="sm" type="submit" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Authenticate Staff
                  </Button>
                </div>
              </form>

              {/* Quick Clinician Role Switcher */}
              <div className="pt-3 border-t border-bji-slate-200 space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-bji-slate-500 block">
                  Quick Demo Clinicians:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-meta">
                  <button
                    type="button"
                    onClick={() => {
                      switchUser("Practitioner/dr-thorne");
                      onClose();
                    }}
                    className="p-1.5 rounded-bji border border-bji-slate-200 text-left hover:bg-bji-slate-50 flex items-center justify-between"
                  >
                    <span>Dr. Thorne (Physician)</span>
                    <Badge tone="info" size="xs">CPOE/Meds</Badge>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchUser("Practitioner/nurse-vance");
                      onClose();
                    }}
                    className="p-1.5 rounded-bji border border-bji-slate-200 text-left hover:bg-bji-slate-50 flex items-center justify-between"
                  >
                    <span>Nurse Vance (Nurse)</span>
                    <Badge tone="success" size="xs">eMAR/Vitals</Badge>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchUser("Practitioner/pharm-chen");
                      onClose();
                    }}
                    className="p-1.5 rounded-bji border border-bji-slate-200 text-left hover:bg-bji-slate-50 flex items-center justify-between"
                  >
                    <span>Dr. Chen (Pharmacist)</span>
                    <Badge tone="warning" size="xs">Rx Verify</Badge>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchUser("Practitioner/rad-watson");
                      onClose();
                    }}
                    className="p-1.5 rounded-bji border border-bji-slate-200 text-left hover:bg-bji-slate-50 flex items-center justify-between"
                  >
                    <span>Dr. Watson (Radiology)</span>
                    <Badge tone="neutral" size="xs">PACS</Badge>
                  </button>
                </div>
              </div>
            </TabContent>

            {/* TAB 2: PATIENT PORTAL LOGIN */}
            <TabContent value="patient" className="space-y-3 pt-3">
              <form onSubmit={handlePatientSubmit} className="space-y-3">
                <Input
                  label="Patient Medical Record Number (MRN)"
                  placeholder="e.g. BJI-SJM-001001"
                  leftSlot={<User className="w-3.5 h-3.5" />}
                  value={patientMrn}
                  onChange={(e) => setPatientMrn(e.target.value)}
                  required
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  placeholder="YYYY-MM-DD"
                  leftSlot={<Calendar className="w-3.5 h-3.5" />}
                  value={patientDob}
                  onChange={(e) => setPatientDob(e.target.value)}
                  required
                />

                {patientError && (
                  <Alert severity="critical" title="Patient Verification Failed" description={patientError} />
                )}

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-meta text-bji-slate-500">
                    Secure Patient Health Record
                  </span>
                  <Button variant="info" size="sm" type="submit" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Open Patient Portal
                  </Button>
                </div>
              </form>

              {/* Quick Demo Patients */}
              <div className="pt-3 border-t border-bji-slate-200 space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-bji-slate-500 block">
                  Quick Demo Patients:
                </span>
                <div className="space-y-1 text-meta">
                  <button
                    type="button"
                    onClick={() => {
                      handleFacilityChange("fac-st-jude");
                      loginPatient("BJI-SJM-001001", "1958-04-12", "fac-st-jude");
                      onClose();
                    }}
                    className="w-full p-1.5 rounded-bji border border-bji-slate-200 text-left hover:bg-bji-slate-50 flex items-center justify-between"
                  >
                    <span>Eleanor Vance (MRN BJI-SJM-001001 • DOB: 1958-04-12)</span>
                    <Badge tone="info" size="xs">St. Jude</Badge>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFacilityChange("fac-apex-valley");
                      loginPatient("BJI-APX-002001", "1984-06-15", "fac-apex-valley");
                      onClose();
                    }}
                    className="w-full p-1.5 rounded-bji border border-bji-slate-200 text-left hover:bg-bji-slate-50 flex items-center justify-between"
                  >
                    <span>Robert Sterling (MRN BJI-APX-002001 • DOB: 1984-06-15)</span>
                    <Badge tone="info" size="xs">Apex Valley</Badge>
                  </button>
                </div>
              </div>
            </TabContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-bji-slate-50 border-t border-bji-slate-200 flex items-center justify-between text-meta text-bji-slate-500">
          <span>Security Protocol: HIPAA / GDPR Compliant RBAC</span>
          <Button variant="ghost" size="xs" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
