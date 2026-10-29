"use client";

import React, { useState } from "react";
import { useHospital } from "@/lib/state/hospital-store";
import { useSession } from "@/lib/auth/session-context";
import { HealthcareFacility, FacilityType, DepartmentType } from "@/types/hospital";
import { 
  Building2, 
  CheckCircle2, 
  Layers, 
  MapPin, 
  Phone, 
  Mail, 
  UserCheck, 
  ShieldCheck, 
  X, 
  AlertCircle 
} from "lucide-react";
import { Button, Input, Select, Badge, Alert } from "@/components/ui";

interface RegisterFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFacilityCreated?: (facilityId: string) => void;
}

export const RegisterFacilityModal: React.FC<RegisterFacilityModalProps> = ({
  isOpen,
  onClose,
  onFacilityCreated
}) => {
  const { registerFacility } = useHospital();
  const { loginStaff } = useSession();

  // Step 1: Facility Demographics
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<FacilityType>("HOSPITAL");
  const [mrnPrefix, setMrnPrefix] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bedCapacity, setBedCapacity] = useState(30);

  // Step 2: Initial Admin Credentials
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [adminTitle, setAdminTitle] = useState("Chief Medical Officer / Facility Admin");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ facilityName: string; adminEmail: string } | null>(null);

  if (!isOpen) return null;

  // Auto-generate Code and MRN Prefix if typing name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!code) {
      const generatedCode = val
        .split(" ")
        .filter(Boolean)
        .map(w => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 4);
      setCode(generatedCode);
      setMrnPrefix(generatedCode ? `${generatedCode}-EHR` : "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please specify the official facility name.");
      return;
    }
    if (!code.trim()) {
      setError("Please specify a unique 3-4 letter facility code.");
      return;
    }
    if (!adminName.trim() || !adminEmail.trim()) {
      setError("Facility Administrator account name and email are mandatory.");
      return;
    }

    setIsSubmitting(true);
    try {
      const initialDepartments: { name: string; type: DepartmentType; bedCount?: number }[] = [
        { name: "Emergency Department", type: "EMERGENCY", bedCount: Math.max(4, Math.floor(bedCapacity * 0.2)) },
        { name: "Intensive Care Unit (ICU)", type: "INTENSIVE_CARE", bedCount: Math.max(2, Math.floor(bedCapacity * 0.15)) },
        { name: "Inpatient Med-Surg Ward", type: "MED_SURG", bedCount: Math.max(10, Math.floor(bedCapacity * 0.5)) },
        { name: "Operating Theatre & Surgical Suite", type: "MED_SURG", bedCount: 0 },
        { name: "Inpatient Central Pharmacy", type: "PHARMACY", bedCount: 0 }
      ];

      const res = registerFacility(
        {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          type,
          mrnPrefix: mrnPrefix.trim() || `${code.trim().toUpperCase()}-MRN`,
          address: address.trim() || "100 Medical Center Parkway, Metro Clinical District",
          phone: phone.trim() || "+1 (555) 789-0100",
          email: email.trim() || `admin@${code.toLowerCase()}-health.org`,
          totalBedCapacity: bedCapacity,
          departments: initialDepartments
        },
        {
          name: adminName.trim(),
          email: adminEmail.trim(),
          title: adminTitle.trim(),
          password: adminPassword.trim() || "admin123"
        }
      );

      // Automatically sign in as the newly provisioned administrator
      await loginStaff(adminEmail.trim(), adminPassword.trim() || "admin123", res.facility.id);

      setSuccessInfo({
        facilityName: res.facility.name,
        adminEmail: res.adminStaff.email || adminEmail
      });

      if (onFacilityCreated) {
        onFacilityCreated(res.facility.id);
      }

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err?.message || "Failed to register healthcare facility.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bji-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-bji border border-bji-slate-300 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-bji-slate-900 text-white flex items-center justify-between border-b border-bji-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-bji-sm bg-bji-green-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Onboard Healthcare Facility</h2>
              <p className="text-[11px] text-bji-slate-300">Multi-tenant clinical workspace registration</p>
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <Alert tone="danger" title="Registration Incomplete">
              {error}
            </Alert>
          )}

          {successInfo && (
            <Alert tone="success" title="Facility Provisioned Successfully">
              {successInfo.facilityName} is now established. You are logged in as {successInfo.adminEmail}. Switching workspace...
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Section 1: Facility Profile */}
            <div className="border border-bji-slate-200 rounded-bji p-3.5 bg-bji-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-bji-slate-200 pb-2">
                <span className="font-bold text-bji-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                  <Building2 className="w-3.5 h-3.5 text-bji-green-700" />
                  1. Facility Details &amp; Operational Identity
                </span>
                <span className="text-[10px] text-bji-slate-500 font-mono">Tenant Workspace</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Facility Name <span className="text-bji-red-600">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Hope Valley Regional Hospital"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Facility Code <span className="text-bji-red-600">*</span>
                  </label>
                  <Input
                    placeholder="e.g. HVR"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Facility Classification</label>
                  <Select
                    value={type}
                    onChange={(e) => setType(e.target.value as FacilityType)}
                  >
                    <option value="HOSPITAL">General Acute Hospital</option>
                    <option value="CLINIC">Outpatient Ambulatory Clinic</option>
                    <option value="MEDICAL_CENTER">Tertiary Academic Medical Center</option>
                    <option value="DIAGNOSTIC_CENTER">Diagnostic Imaging &amp; Lab Center</option>
                    <option value="SPECIALIST_CENTER">Cardiovascular / Specialty Hospital</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">MRN Prefix</label>
                  <Input
                    placeholder="e.g. HVR-MRN"
                    value={mrnPrefix}
                    onChange={(e) => setMrnPrefix(e.target.value.toUpperCase())}
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Licensed Bed Capacity</label>
                  <Input
                    type="number"
                    min={4}
                    max={500}
                    value={bedCapacity}
                    onChange={(e) => setBedCapacity(Number(e.target.value) || 20)}
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Primary Telephone</label>
                  <Input
                    placeholder="+1 (555) 789-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Facility Contact Email</label>
                  <Input
                    type="email"
                    placeholder="info@hopevalleyhealth.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-bji-slate-700 font-semibold mb-1">Physical Address</label>
                  <Input
                    placeholder="450 Hospital Drive, Healthcare District, Suite 100"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Facility Administrator Account */}
            <div className="border border-bji-slate-200 rounded-bji p-3.5 bg-bji-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-bji-slate-200 pb-2">
                <span className="font-bold text-bji-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5 text-bji-green-700" />
                  2. Primary Facility Administrator Account
                </span>
                <Badge tone="info" size="xs">Root Admin Permissions</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Administrator Full Name <span className="text-bji-red-600">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Dr. Catherine Morales, MD"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Administrative Email (Login ID) <span className="text-bji-red-600">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="c.morales@hopevalleyhealth.org"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Professional Title</label>
                  <Input
                    placeholder="Chief Executive Officer / Medical Director"
                    value={adminTitle}
                    onChange={(e) => setAdminTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Account Password / PIN</label>
                  <Input
                    type="password"
                    placeholder="admin123"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Operational Footprint Preview */}
            <div className="p-3 rounded-bji bg-bji-green-50 border border-bji-green-200 flex items-center justify-between text-[11px] text-bji-green-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-bji-green-700 shrink-0" />
                <span>
                  Initial provisioning includes <strong>5 Core Clinical Wards</strong> (Emergency, ICU, Med-Surg, Surgical OT, Pharmacy) and <strong>{bedCapacity} trackable beds</strong> with telemetry.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-bji-slate-200">
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
                className="bg-bji-green-700 hover:bg-bji-green-800 text-white font-bold"
              >
                {isSubmitting ? "Provisioning Facility Workspace..." : "Register Facility & Launch Workspace"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
