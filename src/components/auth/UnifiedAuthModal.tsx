"use client";

import React, { useState } from "react";
import Image from "next/image";
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
  const [selectedFacilityId, setSelectedFacilityId] = useState(activeFacilityId || "");

  // Staff Form
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffError, setStaffError] = useState("");

  // Patient Form
  const [patientMrn, setPatientMrn] = useState("");
  const [patientDob, setPatientDob] = useState("");
  const [patientError, setPatientError] = useState("");

  if (!isOpen) return null;

  const handleFacilityChange = (facId: string) => {
    setSelectedFacilityId(facId);
    switchFacility(facId);
    setStaffEmail("");
    setStaffPassword("");
    setPatientMrn("");
    setPatientDob("");
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError("");
    const success = await loginStaff(staffEmail, staffPassword, selectedFacilityId);
    if (success) {
      onClose();
    } else {
      setStaffError("Invalid staff email or password for the selected facility.");
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
              <Image src="/icons/bji-medisupport-192.png" alt="" aria-hidden="true" width={32} height={32} className="rounded-md" />
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
                  label="Account Password"
                  type="password"
                  placeholder="Enter your account password"
                  autoComplete="current-password"
                  leftSlot={<KeyRound className="w-3.5 h-3.5" />}
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
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
