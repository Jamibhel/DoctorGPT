"use client";

import React, { useState } from "react";
import { useHospital } from "@/lib/state/hospital-store";
import { StaffMember, UserRole, Permission } from "@/types/hospital";
import { 
  UserCheck, 
  Shield, 
  Key, 
  Briefcase, 
  CheckSquare, 
  X, 
  AlertCircle, 
  Building2 
} from "lucide-react";
import { Button, Input, Select, Badge, Alert } from "@/components/ui";

interface RegisterStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffCreated?: (staff: StaffMember) => void;
}

const DEFAULT_PERMISSIONS_BY_ROLE: Record<UserRole, Permission[]> = {
  PHYSICIAN: [
    'patients:read', 'patients:create', 'patients:update',
    'encounters:read', 'encounters:create', 'encounters:update',
    'orders:read', 'orders:create', 'orders:cancel',
    'labs:read', 'labs:create',
    'medications:read',
    'vitals:read', 'vitals:create',
    'notes:create', 'notes:sign',
    'beds:read'
  ],
  NURSE: [
    'patients:read', 'patients:update',
    'encounters:read',
    'orders:read',
    'labs:read', 'labs:create',
    'medications:read', 'medications:administer',
    'vitals:read', 'vitals:create',
    'notes:create',
    'beds:read', 'beds:manage'
  ],
  PHARMACIST: [
    'patients:read',
    'encounters:read',
    'orders:read',
    'labs:read',
    'medications:read', 'medications:verify', 'medications:dispense',
    'notes:create'
  ],
  RADIOLOGIST: [
    'patients:read',
    'encounters:read',
    'orders:read',
    'notes:create', 'notes:sign'
  ],
  SURGEON: [
    'patients:read', 'patients:create', 'patients:update',
    'encounters:read', 'encounters:create', 'encounters:update',
    'orders:read', 'orders:create', 'orders:cancel',
    'labs:read',
    'medications:read',
    'vitals:read',
    'notes:create', 'notes:sign',
    'beds:read'
  ],
  FACILITY_ADMIN: [
    'patients:read', 'patients:create', 'patients:update',
    'encounters:read', 'encounters:create', 'encounters:update',
    'orders:read', 'orders:create', 'orders:cancel',
    'labs:read', 'labs:create', 'labs:verify',
    'medications:read', 'medications:verify', 'medications:dispense', 'medications:administer',
    'vitals:read', 'vitals:create',
    'notes:create', 'notes:sign', 'notes:amend',
    'beds:read', 'beds:manage',
    'staff:read', 'staff:manage',
    'facility:settings', 'audit:read'
  ],
  HOSPITAL_ADMINISTRATOR: [
    'patients:read', 'patients:create', 'patients:update',
    'encounters:read', 'encounters:create', 'encounters:update',
    'orders:read', 'orders:create', 'orders:cancel',
    'labs:read', 'labs:create', 'labs:verify',
    'medications:read', 'medications:verify', 'medications:dispense', 'medications:administer',
    'vitals:read', 'vitals:create',
    'notes:create', 'notes:sign', 'notes:amend',
    'beds:read', 'beds:manage',
    'staff:read', 'staff:manage',
    'facility:settings', 'audit:read'
  ],
  LAB_TECH: [
    'patients:read',
    'encounters:read',
    'orders:read',
    'labs:read', 'labs:create', 'labs:verify'
  ],
  CLINICAL_STAFF: [
    'patients:read',
    'encounters:read',
    'vitals:read', 'vitals:create',
    'beds:read'
  ]
};

export const RegisterStaffModal: React.FC<RegisterStaffModalProps> = ({
  isOpen,
  onClose,
  onStaffCreated
}) => {
  const { activeFacility, departments, createStaffMember } = useHospital();

  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("PHYSICIAN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || "");
  const [title, setTitle] = useState("Staff Physician / Internist");
  const [npi, setNpi] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [pagerNumber, setPagerNumber] = useState("1201");
  const [activeShift, setActiveShift] = useState<"DAY" | "NIGHT" | "ROTATING">("DAY");
  const [onCall, setOnCall] = useState(false);

  // Selected Permissions
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    DEFAULT_PERMISSIONS_BY_ROLE["PHYSICIAN"]
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setSelectedPermissions(DEFAULT_PERMISSIONS_BY_ROLE[newRole] || DEFAULT_PERMISSIONS_BY_ROLE.CLINICAL_STAFF);

    if (newRole === "PHYSICIAN") setTitle("Attending Physician");
    else if (newRole === "NURSE") setTitle("Registered Nurse / Bedside Lead");
    else if (newRole === "PHARMACIST") setTitle("Clinical Pharmacy Specialist");
    else if (newRole === "RADIOLOGIST") setTitle("Diagnostic Radiologist");
    else if (newRole === "SURGEON") setTitle("Attending Surgeon");
    else if (newRole === "FACILITY_ADMIN") setTitle("Facility Administrator");
    else if (newRole === "LAB_TECH") setTitle("Medical Laboratory Technologist");
  };

  const togglePermission = (perm: Permission) => {
    setSelectedPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please specify the staff member's full name.");
      return;
    }
    if (!email.trim()) {
      setError("Email address is required for credential sign-in.");
      return;
    }

    try {
      const newStaff = createStaffMember({
        name: name.trim(),
        role,
        departmentId: departmentId || departments[0]?.id || "DEPT-1",
        email: email.trim(),
        password: password.trim() || "password123",
        title: title.trim(),
        npi: npi.trim() || `1${Math.floor(100000000 + Math.random() * 900000000)}`,
        licenseNumber: licenseNumber.trim() || `LIC-${Math.floor(10000 + Math.random() * 90000)}`,
        pagerNumber: pagerNumber.trim(),
        onCall,
        activeShift,
        permissions: selectedPermissions
      });

      setSuccess(`Account provisioned for ${newStaff.name} (${newStaff.role}).`);
      if (onStaffCreated) {
        onStaffCreated(newStaff);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to create staff member account.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bji-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-bji border border-bji-slate-300 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-bji-slate-900 text-white flex items-center justify-between border-b border-bji-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-bji-sm bg-bji-blue-600 text-white flex items-center justify-center shadow-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Provision Clinician / Staff Account</h2>
              <p className="text-[11px] text-bji-slate-300">
                Establish certified credentials at {activeFacility.name}
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
            <Alert tone="danger" title="Provisioning Error">
              {error}
            </Alert>
          )}

          {success && (
            <Alert tone="success" title="Account Active">
              {success} Closing wizard...
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Identity & Credentials */}
            <div className="border border-bji-slate-200 rounded-bji p-3.5 bg-bji-slate-50/50 space-y-3">
              <span className="font-bold text-bji-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wide border-b border-bji-slate-200 pb-2">
                <Briefcase className="w-3.5 h-3.5 text-bji-blue-700" />
                1. Professional Identity &amp; Role
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Full Legal Name <span className="text-bji-red-600">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Dr. Jennifer Vance, MD"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Clinical Role <span className="text-bji-red-600">*</span>
                  </label>
                  <Select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  >
                    <option value="PHYSICIAN">Physician (Attending / Fellow)</option>
                    <option value="SURGEON">Attending Surgeon</option>
                    <option value="NURSE">Registered Nurse / Charge Nurse</option>
                    <option value="PHARMACIST">Clinical Pharmacist</option>
                    <option value="RADIOLOGIST">Diagnostic Radiologist</option>
                    <option value="LAB_TECH">Laboratory Technologist</option>
                    <option value="FACILITY_ADMIN">Facility Administrator</option>
                    <option value="CLINICAL_STAFF">General Clinical Support Staff</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Sign-In Email <span className="text-bji-red-600">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="j.vance@bjihospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">
                    Security Password / PIN <span className="text-bji-red-600">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="password123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Assigned Department</label>
                  <Select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.floor})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Professional Title</label>
                  <Input
                    placeholder="Attending Hospitalist"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 2. Regulatory & Pager Identifiers */}
            <div className="border border-bji-slate-200 rounded-bji p-3.5 bg-bji-slate-50/50 space-y-3">
              <span className="font-bold text-bji-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wide border-b border-bji-slate-200 pb-2">
                <Shield className="w-3.5 h-3.5 text-bji-green-700" />
                2. Licensure, NPI &amp; Shift Operations
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">NPI Number (10 digits)</label>
                  <Input
                    placeholder="1098765432"
                    value={npi}
                    onChange={(e) => setNpi(e.target.value)}
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Medical License Number</label>
                  <Input
                    placeholder="MD-448102"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Hospital Pager / Ext</label>
                  <Input
                    placeholder="1201"
                    value={pagerNumber}
                    onChange={(e) => setPagerNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-bji-slate-700 font-semibold mb-1">Primary Shift</label>
                  <Select
                    value={activeShift}
                    onChange={(e) => setActiveShift(e.target.value as any)}
                  >
                    <option value="DAY">Day Shift (07:00 - 19:00)</option>
                    <option value="NIGHT">Night Shift (19:00 - 07:00)</option>
                    <option value="ROTATING">Rotating Coverage</option>
                  </Select>
                </div>

                <div className="md:col-span-2 flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-bji-slate-800">
                    <input
                      type="checkbox"
                      checked={onCall}
                      onChange={(e) => setOnCall(e.target.checked)}
                      className="w-4 h-4 rounded text-bji-green-600 focus:ring-0"
                    />
                    <span>Flag as Active On-Call Attending for Code Consultations</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 3. Role Permissions Checklist */}
            <div className="border border-bji-slate-200 rounded-bji p-3.5 bg-bji-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-bji-slate-200 pb-2">
                <span className="font-bold text-bji-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                  <Key className="w-3.5 h-3.5 text-bji-amber-700" />
                  3. Assigned Clinical System Permissions ({selectedPermissions.length})
                </span>
                <Badge tone="neutral" size="xs">RBAC Security Guard</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 bg-white rounded border border-bji-slate-200">
                {(
                  [
                    'patients:read', 'patients:create', 'patients:update',
                    'encounters:read', 'encounters:create', 'encounters:update',
                    'orders:read', 'orders:create', 'orders:cancel',
                    'labs:read', 'labs:create', 'labs:verify',
                    'medications:read', 'medications:verify', 'medications:dispense', 'medications:administer',
                    'vitals:read', 'vitals:create',
                    'notes:create', 'notes:sign', 'notes:amend',
                    'beds:read', 'beds:manage',
                    'staff:read', 'staff:manage',
                    'facility:settings', 'audit:read'
                  ] as Permission[]
                ).map((perm) => (
                  <label
                    key={perm}
                    className="flex items-center gap-1.5 text-[11px] text-bji-slate-700 hover:text-bji-slate-900 cursor-pointer p-1 rounded hover:bg-bji-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="w-3.5 h-3.5 rounded text-bji-blue-600 focus:ring-0"
                    />
                    <span className="font-mono text-[10px]">{perm}</span>
                  </label>
                ))}
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
                className="bg-bji-blue-700 hover:bg-bji-blue-800 text-white font-bold"
              >
                Provision Account &amp; Assign Credentials
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
