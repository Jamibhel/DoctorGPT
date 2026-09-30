"use client";

import React, { useState } from "react";
import { 
  Stethoscope, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  Activity,
  UserCheck,
  CheckCircle2
} from "lucide-react";

interface ClinicianLoginPageProps {
  onLoginSuccess: (clinician: { name: string; role: string; department: string; npi: string }) => void;
}

export const ClinicianLoginPage: React.FC<ClinicianLoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("a.thorne@stjude-health.org");
  const [password, setPassword] = useState("••••••••••••");
  const [department, setDepartment] = useState("Endocrinology & Metabolic Medicine");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onLoginSuccess({
        name: "Dr. Alexander Thorne, MD",
        role: "Attending Physician & Clinical Lead",
        department,
        npi: "1982736402"
      });
      setIsSubmitting(false);
    }, 300);
  };

  const handleFastTrackDemo = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onLoginSuccess({
        name: "Dr. Alexander Thorne, MD",
        role: "Attending Physician & Clinical Lead",
        department: "Endocrinology & Metabolic Medicine",
        npi: "1982736402"
      });
      setIsSubmitting(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans">
      {/* Header Bar */}
      <header className="px-5 sm:px-10 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm text-white">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-slate-900">DoctorGPT</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Clinical AI
              </span>
            </div>
            <p className="text-xs text-slate-500">Intelligent Clinical Assistant</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Cloud Active
          </span>
          <span className="flex items-center gap-1 text-blue-600 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini Flash Connected
          </span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-slate-50/50">
        <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm relative">
          
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 mb-3 border border-emerald-100">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinician Portal</h1>
            <p className="text-sm text-slate-500 mt-1">
              Sign in to manage patient consultations, longitudinal trends, and orders.
            </p>
          </div>

          {/* 1-Click Fast Track Primary Button */}
          <div className="mb-6">
            <button
              onClick={handleFastTrackDemo}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/15 flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <UserCheck className="w-4 h-4" />
              <span>Fast-Track: Sign In as Dr. Thorne</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
              <span>Endocrinology & Internal Med</span>
              <span>NPI: 1982736402</span>
            </div>
          </div>

          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-xs uppercase tracking-wider text-slate-400 font-medium">or email login</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Institutional Credentials Form */}
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
              >
                <option value="Endocrinology & Metabolic Medicine">Endocrinology & Metabolic Medicine</option>
                <option value="Cardiology & Vascular Medicine">Cardiology & Vascular Medicine</option>
                <option value="Ambulatory Primary Care">Ambulatory Primary Care</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Hospital Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="doctor@hospital.org"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition flex items-center justify-center gap-2"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4" />
              HIPAA Compliant
            </span>
            <span className="text-slate-400">AES-256 GCM</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        DoctorGPT • Protected Clinical Workstation • Google Gemini & Cloud Firestore
      </footer>
    </div>
  );
};
