"use client";

import React, { useState } from "react";
import { useHospital } from "@/lib/state/hospital-store";
import { useSession } from "@/lib/auth/session-context";
import { 
  Building2, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  Activity, 
  ArrowRight, 
  Plus, 
  AlertCircle 
} from "lucide-react";
import { Button, Input, Select, Badge, Alert } from "@/components/ui";
import { RegisterFacilityModal } from "@/components/facility/RegisterFacilityModal";

export const ClinicalLoginScreen: React.FC = () => {
  const { facilities, activeFacilityId, switchFacility } = useHospital();
  const { loginStaff, availableUsers } = useSession();

  const [selectedFacilityId, setSelectedFacilityId] = useState(activeFacilityId || facilities[0]?.id || "fac-st-jude");
  const [email, setEmail] = useState("a.thorne@bjihospital.org");
  const [password, setPassword] = useState("1234");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleFacilityChange = (facId: string) => {
    setSelectedFacilityId(facId);
    switchFacility(facId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const success = loginStaff(email.trim(), password.trim(), selectedFacilityId);
    if (!success) {
      setError("Invalid clinician username/email or password for the selected facility.");
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (userEmail: string, userPin: string, facilityId: string) => {
    setError(null);
    setEmail(userEmail);
    setPassword(userPin);
    setSelectedFacilityId(facilityId);
    switchFacility(facilityId);
    loginStaff(userEmail, userPin, facilityId);
  };

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId) || facilities[0];

  return (
    <div className="min-h-screen bg-bji-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 antialiased selection:bg-bji-green-600 selection:text-white">
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Top Banner */}
      <header className="relative z-10 flex items-center justify-between border-b border-bji-slate-800 pb-3 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-bji-sm bg-bji-green-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">BJI MediSupport</span>
              <span className="text-[10px] bg-bji-green-950 text-bji-green-400 border border-bji-green-800 px-1.5 py-0.2 rounded font-mono font-semibold">
                EHR OS
              </span>
            </div>
            <p className="text-[10px] text-bji-slate-400">Clinical Enterprise Workstation &amp; HospitalOS</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setIsRegisterModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5 text-bji-green-400" />}
            className="bg-bji-slate-800 border-bji-slate-700 text-bji-slate-200 hover:bg-bji-slate-700 hover:text-white"
          >
            Register New Hospital / Clinic
          </Button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-8">
        <div className="max-w-md w-full bg-white text-bji-slate-900 rounded-bji border border-bji-slate-200 shadow-2xl p-6 space-y-5">
          <div className="space-y-1 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-bji bg-bji-green-50 text-bji-green-700 border border-bji-green-200 mb-2 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-base font-bold text-bji-slate-900 tracking-tight">
              Clinician Authentication Gateway
            </h1>
            <p className="text-xs text-bji-slate-500">
              Sign in with certified staff credentials to access patient charts
            </p>
          </div>

          {error && (
            <Alert tone="danger" title="Authentication Failed">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Facility Selector */}
            <div>
              <label className="block text-bji-slate-700 font-semibold mb-1 flex items-center justify-between">
                <span>Healthcare Facility Tenant</span>
                <span className="text-[10px] text-bji-green-700 font-mono">
                  {selectedFacility?.mrnPrefix || "MRN Prefix"}
                </span>
              </label>
              <Select
                value={selectedFacilityId}
                onChange={(e) => handleFacilityChange(e.target.value)}
                className="w-full"
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.code})
                  </option>
                ))}
              </Select>
            </div>

            {/* Email / Username */}
            <div>
              <label className="block text-bji-slate-700 font-semibold mb-1">
                Clinician Email or Staff ID
              </label>
              <Input
                type="text"
                placeholder="clinician@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-bji-slate-700 font-semibold mb-1">
                Security Password / PIN
              </label>
              <Input
                type="password"
                placeholder="Enter password or 4-digit PIN"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="w-full bg-bji-green-700 hover:bg-bji-green-800 text-white font-bold py-2 shadow-sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting ? "Authenticating Clinician..." : "Sign In to Workstation"}
            </Button>
          </form>

          {/* Quick-Login Demo Clinicians */}
          <div className="pt-4 border-t border-bji-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold uppercase tracking-wider text-bji-slate-500">
                1-Click Quick Clinician Sign-In:
              </span>
              <Badge tone="info" size="xs">Demo Mode</Badge>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin("a.thorne@bjihospital.org", "1234", "fac-st-jude")}
                className="p-2 rounded-bji border border-bji-slate-200 hover:border-bji-blue-400 bg-bji-slate-50 hover:bg-bji-blue-50/50 text-left transition text-xs space-y-0.5"
              >
                <div className="font-bold text-bji-slate-900 truncate">Dr. Alexander Thorne</div>
                <div className="text-[10px] text-bji-slate-500">Physician • CPOE Orders</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("m.vance@bjihospital.org", "1234", "fac-st-jude")}
                className="p-2 rounded-bji border border-bji-slate-200 hover:border-bji-blue-400 bg-bji-slate-50 hover:bg-bji-blue-50/50 text-left transition text-xs space-y-0.5"
              >
                <div className="font-bold text-bji-slate-900 truncate">Nurse Marcus Vance</div>
                <div className="text-[10px] text-bji-slate-500">RN • Bedside eMAR / Vitals</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("s.chen@bjihospital.org", "1234", "fac-st-jude")}
                className="p-2 rounded-bji border border-bji-slate-200 hover:border-bji-blue-400 bg-bji-slate-50 hover:bg-bji-blue-50/50 text-left transition text-xs space-y-0.5"
              >
                <div className="font-bold text-bji-slate-900 truncate">Dr. Sarah Chen</div>
                <div className="text-[10px] text-bji-slate-500">PharmD • Verification</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("e.rostova@bjihospital.org", "1234", "fac-st-jude")}
                className="p-2 rounded-bji border border-bji-slate-200 hover:border-bji-blue-400 bg-bji-slate-50 hover:bg-bji-blue-50/50 text-left transition text-xs space-y-0.5"
              >
                <div className="font-bold text-bji-slate-900 truncate">Elena Rostova</div>
                <div className="text-[10px] text-bji-slate-500">Admin • Facility Config</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-[11px] text-bji-slate-500 border-t border-bji-slate-800 pt-3 max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Protected Health Information (PHI) • Encrypted Under HIPAA Security Rule § 164.312</span>
        <span className="font-mono text-bji-slate-400">BJI MediSupport EHR Engine v2.4</span>
      </footer>

      {/* Register Facility Modal */}
      <RegisterFacilityModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onFacilityCreated={(newFacId) => {
          setSelectedFacilityId(newFacId);
        }}
      />
    </div>
  );
};
